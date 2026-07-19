import { useMediaPermissions } from "@/hooks/usePermissions";
import { useMediaStore } from "@/utils/mediaStore";
import React, { PropsWithChildren, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
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
  withTiming,
} from "react-native-reanimated";
import { Camera, CameraDevice, CameraProps } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import RecordingIndicator from "../recordingIndicator";
import NoCameraFound from "./NoCameraFound";
import NoCameraPermission from "./NoCameraPermission";
import QuickSend from "./QuickSend";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type cameraViewType = {
  activeCamera: CameraDevice | null;
  isRecording: boolean;
  cameraRef: React.RefObject<Camera | null>;
  stopRecording: () => void;
  zoomLevel: SharedValue<number>;
  /** Bump this value (e.g. shutterSignal.set(shutterSignal.get() + 1))
   *  right before takePhoto() to trigger the shutter flash. */
  shutterSignal?: SharedValue<number>;
};

const SHUTTER_IN_MS = 25;
const SHUTTER_OUT_MS = 150;

function CameraComponent({
  activeCamera,
  cameraRef,
  isRecording,
  stopRecording,
  zoomLevel,
  shutterSignal,
  children,
}: PropsWithChildren<cameraViewType>) {
  const dimensions = useWindowDimensions()
  const SIZE = dimensions.width * .5
  const format = useMemo(() => {
    return activeCamera!.formats.find(
      (f) => f.videoWidth === 1920 && f.videoHeight === 1080 && f.maxFps >= 28,
    );
  }, [activeCamera]);

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

  const gesture = Gesture.Pan()
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

  return (
    <GestureDetector gesture={gesture}>
      <View style={{
        width: SIZE,
        height: SIZE,
      }}>
        <View style={{
          width: SIZE,
          height: SIZE,
        }}>
          <ReanimatedCamera
            ref={cameraRef}
            enableZoomGesture
            style={[
              {
                width: SIZE,
                height: SIZE,
                backgroundColor: "black", borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: "hidden"
              },
            ]}
            device={activeCamera!}
            isActive={true}
            animatedProps={animatedProps}
            audio={true}
            photo={true}
            video={true}
            format={format}
            photoQualityBalance="balanced"
            outputOrientation={"preview"}
          />
        </View>

        {/* shutter flash overlay */}
        <Reanimated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "black",
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
              zIndex: 50,
            },
            shutterStyle,
          ]}
        />

        {children}
      </View>
    </GestureDetector>
  );
}

export default function CameraView({
  activeCamera,
  cameraRef,
  isRecording,
  stopRecording,
  zoomLevel,
  shutterSignal,
  children,
}: PropsWithChildren<cameraViewType>) {
  const { hasCameraPermissions, hasMicPermissions, requestMediaPermissions } =
    useMediaPermissions();

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
          }}
        />
      )}
      <CameraComponent
        activeCamera={activeCamera}
        cameraRef={cameraRef}
        stopRecording={stopRecording}
        isRecording={isRecording}
        zoomLevel={zoomLevel}
        shutterSignal={shutterSignal}
      >
        {children}
      </CameraComponent>

      {selectedFriend && <QuickSend friend={selectedFriend} />}
    </>
  );
}