import CameraControls from "@/components/camera/CameraControls";
import CameraView from "@/components/camera/CameraView";
import PreviewScreen from "@/components/camera/PreviewScreen";
import ShutterButton from "@/components/camera/ShutterButton";
import { useModal } from "@/components/modals/ModalContext";
import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useCamera } from "@/hooks/useCamera";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function handleRetake() { }

function handleSave() { }

export default function AddScreen() {
  const {
    activeCamera,
    recordingProgress,
    startRecording,
    stopRecording,
    takePhoto,
    cameraRef,
    zoomLevel,
    setUseFlash,
    useFlash,
    flipCamera,
  } = useCamera();
  const { isRecording, mediaPreview, showMediaPreviews, setShowMediaPreviews } = useMediaStore();
  const { showModal, hideModal } = useModal()
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (mediaPreview.length >= MAX_PREVIEW_MEDIA) {
      setShowMediaPreviews(true)
    }
  }, [mediaPreview])

  return (
    <>
      {(!showMediaPreviews) && (
        <View
          style={{ flex: 1, backgroundColor: "black", paddingTop: insets.top }}
        >
          {isFocused && (
            <View style={styles.container}>
              <CameraView
                activeCamera={activeCamera}
                cameraRef={cameraRef}
                isRecording={isRecording}
                zoomLevel={zoomLevel}
                stopRecording={stopRecording}
              >
                <ShutterButton
                  recordingProgress={recordingProgress}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  takePhoto={takePhoto}
                />
              </CameraView>
              {activeCamera && (
                <>
                  <CameraControls
                    flipCamera={flipCamera}
                    setUseFlash={setUseFlash}
                    useFlash={useFlash}
                  />
                </>
              )}
            </View>
          )}
        </View>
      )}
      {(showMediaPreviews) && (
        <PreviewScreen
          mediaItems={mediaPreview}
          onRetake={handleRetake}
          onSave={handleRetake}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  topControls: {
    position: "absolute",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    top: 15,
    paddingHorizontal: 20,
    paddingRight: 5,
  },
});
