import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CameraControls from "@/components/camera/CameraControls";
import CameraView from "@/components/camera/CameraView";
import PreviewScreen from "@/components/camera/PreviewScreen";
import ShutterButton from "@/components/camera/ShutterButton";
import TextEditor from "@/components/editor/TextEditor";
import { useModal } from "@/components/modals/ModalContext";
import Spacer from "@/components/Spacer";
import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useCamera } from "@/hooks/useCamera";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CrumbTypePicker({ open }: { open: () => void }) {
  return (
    <View style={{
      position: "absolute",
      left: 10,
    }}>
      <CustomImageButton size={27} type="text" src={require("../../../assets/images/icons/textcrumb_sel_light.png")} handleClick={() => {
        open()
      }} />
      <Spacer />
      <CustomImageButton size={27} type="text" src={require("../../../assets/images/icons/audiocrumb_sel_light.png")} />
    </View>
  );
}

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
  const { openSheet, closeSheet } = useBottomSheet()

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
                  {!isRecording && <CrumbTypePicker open={() => {
                    openSheet({
                      content: (
                        <TextEditor />
                      ),
                      snapPoints: ["100%"],
                      showHandle: false,
                      reduceAnimations: true
                    })
                  }} />}
                </>
              )}
            </View>
          )}
        </View>
      )}
      {(showMediaPreviews) && (
        <PreviewScreen
          mediaItems={mediaPreview}
          onRetake={() => { }}
          onSave={() => { }}
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
