import { useCamera } from "@/hooks/useCamera";
import { useMediaPermissions } from "@/hooks/usePermissions";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraDevice, CameraProps, useCameraFormat } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import { useShallow } from "zustand/shallow";
import RecordingIndicator from "../recordingIndicator";
import CameraControls from "./CameraControls";
import NoCameraFound from "./NoCameraFound";
import NoCameraPermission from "./NoCameraPermission";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type CameraViewType = {
  onCapture?: () => void
  onRecording?: () => void
  onRecordingEnd?: () => void
};

type CameraComponentType = {
  cameraRef: React.RefObject<Camera | null>
  activeCamera: CameraDevice | null
  zoomLevel: SharedValue<number>
  startRecording: () => void
  stopRecording: () => void
  recordingProgress: SharedValue<number>
  takePhoto: (shutterSignal: SharedValue<number>) => void
  flipCamera: () => void
  useFlash: "on" | "off"
  setUseFlash: (s: "on" | "off") => void
}

const SHUTTER_IN_MS = 25;
const SHUTTER_OUT_MS = 150;

function CameraComponent({
  onCapture,
  onRecording,
  onRecordingEnd,
  activeCamera,
  cameraRef,
  stopRecording,
  zoomLevel,
  startRecording,
  recordingProgress,
  takePhoto,
  flipCamera,
  useFlash,
  setUseFlash,
}: CameraViewType & CameraComponentType) {
  const { isRecording, multiCrumbEnabled, setMultiCrumbEnabled } = useMediaStore(useShallow(s => ({
    isRecording: s.isRecording,
    multiCrumbEnabled: s.multiCrumbEnabled,
    setMultiCrumbEnabled: s.setMultiCrumbEnabled,
  })))
  const isFocused = useIsFocused()
  const shutterSignal = useSharedValue(0);
  const dimensions = useWindowDimensions()
  const SIZE = dimensions.width
  const format = useCameraFormat(activeCamera!, [
    { videoResolution: "max" },
    { photoResolution: "max" },
    { fps: "max" },
    { photoAspectRatio: SIZE },
    { videoAspectRatio: SIZE },
  ]);

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoomLevel.get() }),
    [zoomLevel],
  );

  // --- shutter flash ---
  const shutterOpacity = useSharedValue(0);

  const flashShutter = () => {
    shutterOpacity.set(
      withSequence(
        withTiming(1, { duration: SHUTTER_IN_MS, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: SHUTTER_OUT_MS, easing: Easing.in(Easing.quad) }),
      ),
    );
  };

  // photo capture: parent bumps shutterSignal just before takePhoto()
  useAnimatedReaction(
    () => shutterSignal?.get() ?? 0,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        shutterOpacity.set(
          withSequence(
            withTiming(1, { duration: SHUTTER_IN_MS, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: SHUTTER_OUT_MS, easing: Easing.in(Easing.quad) }),
          ),
        );
      }
    },
    [shutterSignal],
  );

  const shutterStyle = useAnimatedStyle(() => ({
    opacity: shutterOpacity.get(),
  }));
  // --- end shutter flash ---

  const handleTouchEnd = () => {
    if (isRecording) stopRecording();
  };

  // for pan to zoom while recording
  const zoomOffset = useSharedValue(0);

  const flipCameraGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(200)
    .onEnd((e, didDoubleTap) => {
      if (didDoubleTap) {
        scheduleOnRN(flipCamera)
      }
    })

  const zoomGesture = Gesture.Pan()
    .onBegin(() => {
      zoomOffset.set(zoomLevel.get());
    })
    .onUpdate((event) => {
      if (!isRecording) return;
      const zoomDelta = -event.translationY / 30;
      const z = zoomOffset.get() + zoomDelta;

      zoomLevel.set(
        interpolate(
          z,
          [1, 15],
          [activeCamera!.minZoom, 15],
          Extrapolation.CLAMP,
        ),
      );
    })
    .onEnd(() => {
      scheduleOnRN(handleTouchEnd);
    });

  const gesture = Gesture.Simultaneous(flipCameraGesture, zoomGesture)

  return (
    <>
      {true &&
        <GestureDetector gesture={gesture}>
          <View
            style={{
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: dimensions.height / 10,
                width: SIZE,
                height: SIZE,
                overflow: "hidden",
              }}
            >
              <ReanimatedCamera
                ref={cameraRef}
                format={format}
                enableZoomGesture
                style={{
                  width: SIZE,
                  height: SIZE,
                }}
                device={activeCamera!}
                isActive={true}
                animatedProps={animatedProps}
                audio={true}
                photo={true}
                video={true}
                photoQualityBalance="speed"
                outputOrientation={"preview"}
              />
              {/* shutter flash overlay */}
              <Reanimated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    width: SIZE,
                    height: SIZE,
                    backgroundColor: "black",
                    zIndex: 1000,
                  },
                  shutterStyle,
                ]}
              />
            </View>

            <CameraControls
              flipCamera={flipCamera}
              setUseFlash={setUseFlash}
              useFlash={useFlash}
              takePhoto={() => {
                takePhoto(shutterSignal)
                onCapture?.()
              }}
              recordingProgress={recordingProgress}
              startRecording={startRecording}
              stopRecording={stopRecording}
            />
          </View>
        </GestureDetector>
      }
    </>
  );
}

export default function CameraView({
  onCapture,
  onRecording,
  onRecordingEnd,
}: CameraViewType) {
  const {
    hasCameraPermissions,
    hasMicPermissions,
    requestMediaPermissions,
  } = useMediaPermissions();

  const isRecording = useMediaStore(s => s.isRecording)
  const insetTop = useSafeAreaInsets().top

  const {
    activeCamera,
    cameraRef,
    startRecording,
    stopRecording,
    takePhoto,
    recordingProgress,
    zoomLevel,
    flipCamera,
    useFlash,
    setUseFlash,
  } = useCamera()

  const selectedFriend = useMediaStore(s => s.selectedFriend);

  if (!hasCameraPermissions || !hasMicPermissions) {
    let missingPermissions = [];

    if (!hasCameraPermissions) missingPermissions.push("camera");
    if (!hasMicPermissions) missingPermissions.push("microphone");

    return (
      <NoCameraPermission
        missingPermissions={missingPermissions}
        requestPerms={requestMediaPermissions}
      />
    );
  }

  if (!activeCamera) return <NoCameraFound />;

  return (
    <>
      {isRecording && (
        <RecordingIndicator
          customStyle={{
            zIndex: 100,
            top: insetTop,
          }}
        />
      )}
      <CameraComponent
        activeCamera={activeCamera}
        cameraRef={cameraRef}
        onCapture={onCapture}
        onRecording={onRecording}
        onRecordingEnd={onRecordingEnd}
        stopRecording={stopRecording}
        zoomLevel={zoomLevel}
        recordingProgress={recordingProgress}
        takePhoto={takePhoto}
        startRecording={startRecording}
        flipCamera={flipCamera}
        setUseFlash={setUseFlash}
        useFlash={useFlash}
      />
    </>
  );
}