import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CameraControls from "@/components/camera/CameraControls";
import CameraView from "@/components/camera/CameraView";
import PreviewBunch from "@/components/camera/PreviewBunch";
import PreviewScreen from "@/components/camera/PreviewScreen";
import ShutterButton from "@/components/camera/ShutterButton";
import RecordCrumb from "@/components/editor/RecordCrumb";
import WriteCrumb from "@/components/editor/WriteCrumb";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useCamera } from "@/hooks/useCamera";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";

type recMode = "image" | "audio"

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
    finishAudioRecording,
    cancelAudioRecording,
  } = useCamera();
  const { isRecording, mediaPreview, showMediaPreviews, setShowMediaPreviews, addPreview } = useMediaStore(
    useShallow((s) => ({
      isRecording: s.isRecording,
      mediaPreview: s.mediaPreview,
      showMediaPreviews: s.showMediaPreviews,
      setShowMediaPreviews: s.setShowMediaPreviews,
      addPreview: s.addMediaPreview,
    }))
  );
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions()
  const { openSheet, closeSheet } = useBottomSheet()
  const maxHeight = height - insets.top
  const [recMode, setRecMode] = useState<recMode>("image")
  const addToPreview = useMediaStore(s => s.addMediaPreview)
  
  const shutterSignal = useSharedValue(0);

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
          {!isRecording && <View style={{
            width: "100%",
            position: "absolute",
            top: insets.top,
            zIndex: 10000,
            alignItems: "center",
            justifyContent: "center",
          }}>
          </View>}
          {isFocused && (
            <View style={styles.container}>
              {recMode === "audio" &&
                <RecordCrumb recordingProgress={audioRecordingProgress} startRecording={startAudioRecording} finishAudioRecording={finishAudioRecording} cancelAudioRecording={cancelAudioRecording} />
              }
              {recMode === "image" && <CameraView
                activeCamera={activeCamera}
                cameraRef={cameraRef}
                isRecording={isRecording}
                zoomLevel={zoomLevel}
                stopRecording={stopRecording}
                shutterSignal={shutterSignal}
              >
                <ShutterButton
                  recordingProgress={recordingProgress}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  takePhoto={() => {
                    shutterSignal.set(shutterSignal.get() + 1);
                    takePhoto()
                  }}
                />
              </CameraView>}
              {activeCamera && (
                <>
                  {recMode === "image" && <CameraControls
                    showTextEditor={() => {
                      openSheet({
                        content: (
                          <WriteCrumb
                            handleCancel={closeSheet}
                            handleSave={crumb => {
                              addToPreview({
                                id: uuidv4(),
                                index: 0,
                                resizeMode: "contain",
                                type: "text",
                                uri: "",
                                text: { index: 0, content: crumb },
                                uploadState: { uploadUrl: "", error: null, pending: false }
                              })
                              closeSheet()
                              setShowMediaPreviews(true)
                            }}
                          />
                        ),
                        snapPoints: [maxHeight],
                        showHandle: false,
                        reduceAnimations: true,
                        borderRadius: 25
                      })
                    }}
                    flipCamera={flipCamera}
                    setUseFlash={setUseFlash}
                    useFlash={useFlash}
                  />}
                </>
              )}
            </View>
          )}
          <PreviewBunch />

          {!isRecording && <View style={{
            width: "80%",
            position: "absolute",
            top: insets.top + 10,
            left: 15,
            zIndex: 11000,
          }}>
            <CustomProfilePictureCircle
              size={40}
              customTextStyle={{
                fontWeight: "700"
              }}
              handleClick={() => {
                // router.push("/(protected)/profile-settings")
              }}
            />
          </View>}
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
