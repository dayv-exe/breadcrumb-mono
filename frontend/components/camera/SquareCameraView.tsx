import { useMediaPermissions } from "@/hooks/usePermissions";
import { useMediaStore } from "@/utils/mediaStore";
import React, { PropsWithChildren, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
  useSharedValue
} from "react-native-reanimated";
import { Camera, CameraDevice, CameraProps } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import RecordingIndicator from "../recordingIndicator";
import NoCameraFound from "./NoCameraFound";
import NoCameraPermission from "./NoCameraPermission";
import QuickSend from "./QuickSend";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type squareCameraViewType = {
  activeCamera: CameraDevice | null;
  isRecording: boolean;
  cameraRef: React.RefObject<Camera | null>;
  stopRecording: () => void;
  zoomLevel: SharedValue<number>;
};

function SquareCameraComponent({
  activeCamera,
  cameraRef,
  isRecording,
  stopRecording,
  zoomLevel,
}: squareCameraViewType) {
  const SIZE = useWindowDimensions().width
  const format = useMemo(() => {
    return activeCamera!.formats.find(
      (f) => f.videoWidth === 1920 && f.videoHeight === 1080 && f.maxFps >= 28,
    );
  }, [activeCamera]);

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoomLevel.get() }),
    [zoomLevel],
  );

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
      if (!isRecording) return
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
        flex: 1,
        aspectRatio: 8 / 16,
      }}>
        <View style={{
          flex: 1,
          aspectRatio: 8 / 16,
        }}>
          <ReanimatedCamera
            ref={cameraRef}
            enableZoomGesture
            style={[
              //StyleSheet.absoluteFill,
              {
                flex: 1,
                aspectRatio: 8 / 16,
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                backgroundColor: "black", overflow: "hidden",
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
      </View>
    </GestureDetector>
  );
}

export default function SquareCameraView({
  activeCamera,
  cameraRef,
  isRecording,
  stopRecording,
  zoomLevel,
  children,
}: PropsWithChildren<squareCameraViewType>) {
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
      <SquareCameraComponent
        activeCamera={activeCamera}
        cameraRef={cameraRef}
        stopRecording={stopRecording}
        isRecording={isRecording}
        zoomLevel={zoomLevel}
      />

      {selectedFriend && <QuickSend friend={selectedFriend} />}
    </>
  );
}