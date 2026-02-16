import { useMediaPermissions } from "@/hooks/usePermissions";
import { useMediaStore } from "@/utils/mediaStore";
import React, { PropsWithChildren, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { Camera, CameraDevice, CameraProps } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import RecordingIndicator from "../recordingIndicator";
import NoCameraFound from "./NoCameraFound";
import NoCameraPermission from "./NoCameraPermission";
import PreviewCard from "./PreviewCard";
import QuickSend from "./QuickSend";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type cameraViewType = {
  activeCamera: CameraDevice | null;
  isRecording: boolean;
  cameraRef: React.RefObject<Camera | null>;
  stopRecording: () => void;
  zoomLevel: SharedValue<number>;
};

function CameraComponent({
  activeCamera,
  cameraRef,
  isRecording,
  stopRecording,
  zoomLevel,
  children,
}: PropsWithChildren<cameraViewType>) {
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
      <View style={StyleSheet.absoluteFill}>
        <ReanimatedCamera
          ref={cameraRef}
          enableZoomGesture
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "black", borderRadius: 25,  overflow: "hidden" },
          ]}
          device={activeCamera!}
          isActive={true}
          animatedProps={animatedProps}
          audio={true}
          photo={true}
          video={true}
          format={format}
          photoQualityBalance="speed"
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
  children,
}: PropsWithChildren<cameraViewType>) {
  const { hasCameraPermissions, hasMicPermissions, requestMediaPermissions } =
    useMediaPermissions();

  const { mediaPreview, setShowMediaPreviews, selectedFriend } = useMediaStore();
  const previewContainerStyle = useAnimatedStyle(() => {
    return {
      bottom: withSpring(!selectedFriend ? 95 : 180, {
        damping: 25,
        stiffness: 250,
        mass: 1
      }),
      left: withSpring(!selectedFriend ? 70 : 45, {
        damping: 25,
        stiffness: 250,
        mass: 1,
      }),
    };
  }, [selectedFriend]);

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
      >
        {children}
      </CameraComponent>

      {selectedFriend && <QuickSend friend={selectedFriend} />}

      {!isRecording && (
        <Reanimated.View style={[styles.previewContainer, previewContainerStyle]}>
          <TouchableOpacity onPress={() => setShowMediaPreviews(true)} style={styles.previewTouchable}>
            {mediaPreview.map((media, index) => {
              return <PreviewCard index={index} src={media.uri} key={index} active />;
            })}
          </TouchableOpacity>
        </Reanimated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
  },
  previewTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
