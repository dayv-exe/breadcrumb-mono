import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CameraControls from "@/components/camera/CameraControls";
import CameraView from "@/components/camera/CameraView";
import PreviewBunch from "@/components/camera/PreviewBunch";
import PreviewScreen from "@/components/camera/PreviewScreen";
import ShutterButton from "@/components/camera/ShutterButton";
import RecordCrumb from "@/components/editor/RecordCrumb";
import WriteCrumb from "@/components/editor/WriteCrumb";
import Spacer from "@/components/Spacer";
import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useCamera } from "@/hooks/useCamera";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";

type recMode = "image" | "audio"

function CrumbTypePicker({ maxSheetHeight, recMode, setRecMode }: { maxSheetHeight: number, recMode: recMode, setRecMode: (m: recMode) => void }) {
  const { openSheet, closeSheet } = useBottomSheet()

  function getImage() {
    if (recMode === "image") {
      return require("../../../assets/images/icons/audiocrumb_sel_light.png")
    }

    return require("../../../assets/images/icons/switchtocamera_unsel_light.png")
  }

  return (
    <View style={{
      position: "absolute",
      left: 10,
    }}>
      <CustomImageButton size={27} type="text" src={require("../../../assets/images/icons/textcrumb_sel_light.png")} handleClick={() => {
        openSheet({
          content: (
            <WriteCrumb handleCancel={closeSheet} />
          ),
          snapPoints: [maxSheetHeight],
          showHandle: false,
          reduceAnimations: true,
          borderRadius: 25
        })
      }} />
      <Spacer />
      <CustomImageButton size={27} type="text" src={getImage()} handleClick={() => {
        setRecMode(recMode === "audio" ? "image" : "audio")
      }} />
    </View>
  );
}

export default function AddScreen() {
  const {
    activeCamera,
    recordingProgress,
    audioRecordingProgress,
    startRecording,
    stopRecording,
    takePhoto,
    cameraRef,
    zoomLevel,
    setUseFlash,
    useFlash,
    flipCamera,
    startAudioRecording,
    stopAudioRecording,
  } = useCamera();
  const { isRecording, mediaPreview, showMediaPreviews, setShowMediaPreviews } = useMediaStore(
    useShallow((s) => ({
      isRecording: s.isRecording,
      mediaPreview: s.mediaPreview,
      showMediaPreviews: s.showMediaPreviews,
      setShowMediaPreviews: s.setShowMediaPreviews
    }))
  );
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions()
  const maxHeight = height - insets.top
  const [recMode, setRecMode] = useState<recMode>("image")

  useEffect(() => {
    if (mediaPreview.length >= MAX_PREVIEW_MEDIA) {
      if (showMediaPreviews) return;
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
              {recMode === "audio" &&
                <RecordCrumb recordingProgress={audioRecordingProgress} startRecording={startAudioRecording} stopRecording={stopAudioRecording} cancelRecording={stopAudioRecording} />
              }
              {recMode === "image" && <CameraView
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
              </CameraView>}
              {activeCamera && (
                <>
                  {recMode === "image" && <CameraControls
                    flipCamera={flipCamera}
                    setUseFlash={setUseFlash}
                    useFlash={useFlash}
                  />}
                  {!isRecording && <CrumbTypePicker maxSheetHeight={maxHeight} recMode={recMode} setRecMode={setRecMode} />}
                </>
              )}
            </View>
          )}
          <PreviewBunch />
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
