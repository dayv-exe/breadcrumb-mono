import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CameraControls from "@/components/camera/CameraControls";
import CameraView from "@/components/camera/CameraView";
import PreviewBunch from "@/components/camera/PreviewBunch";
import PreviewScreen from "@/components/camera/PreviewScreen";
import ShutterButton from "@/components/camera/ShutterButton";
import RecordCrumb from "@/components/editor/RecordCrumb";
import WriteCrumb from "@/components/editor/WriteCrumb";
import SnapCarousel from "@/components/inputs/SnapCarousel";
import { useModal } from "@/components/modals/ModalContext";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import Spacer from "@/components/Spacer";
import { MAX_PREVIEW_MEDIA, MEDIA_FULL_MESSAGE } from "@/constants/appConstants";
import { useCamera } from "@/hooks/useCamera";
import { useMediaStore } from "@/utils/mediaStore";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import { useShallow } from "zustand/shallow";

type recMode = "image" | "audio"

function CrumbTypePicker({ maxSheetHeight, recMode, setRecMode }: { maxSheetHeight: number, recMode: recMode, setRecMode: (m: recMode) => void }) {
  const { openSheet, closeSheet } = useBottomSheet()
  const { showModal, hideModal } = useModal()
  const addToPreview = useMediaStore(s => s.addMediaPreview)
  const mediaPreviews = useMediaStore(s => s.mediaPreview)
  const setShowMediaPreviews = useMediaStore(s => s.setShowMediaPreviews)

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
        if (mediaPreviews.length >= MAX_PREVIEW_MEDIA) {
          showModal({
            message: MEDIA_FULL_MESSAGE,
            showCancelBtn: false,
            primaryBtnText: "Okay",
            onPrimary: () => {
              //setShowMediaPreviews(true)
              hideModal()
            }
          })

          return;
        }
        openSheet({
          content: (
            <WriteCrumb
              handleCancel={closeSheet}
              handleSave={crumb => {
                addToPreview({
                  id: uuidv4(),
                  resizeMode: "contain",
                  type: "text",
                  uri: "",
                  text: crumb
                })
                closeSheet()
                setShowMediaPreviews(true)
              }}
            />
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
  const [modeIndex, setModeIndex] = useState(0)
  const router = useRouter()

  const handleCloseTextCrumb = () => {
    closeSheet()
    setModeIndex(recMode === "image" ? 0 : 1)
  }

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
            <SnapCarousel style={{ height: "auto" }} onSelect={mi => {
              if (mi === 0) {
                setRecMode("image")
              } else {
                openSheet({
                  content: (
                    <WriteCrumb
                      handleCancel={handleCloseTextCrumb}
                      handleSave={crumb => {
                        addPreview({
                          id: uuidv4(),
                          resizeMode: "contain",
                          type: "text",
                          uri: "",
                          text: crumb
                        })
                        handleCloseTextCrumb()
                        setShowMediaPreviews(true)
                      }}
                    />
                  ),
                  snapPoints: [maxHeight],
                  showHandle: false,
                  reduceAnimations: true,
                  borderRadius: 25
                })
                return
              }
            }} selectedIndex={modeIndex}>
              <CustomButton fontSize={18} bold labelText="Photo" type="text" handleClick={() => setModeIndex(0)} customTextStyle={{
                elevation: 7,
                textShadowColor: "#000",
                textShadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                textShadowRadius: 20,
              }} />
              <CustomButton fontSize={18} bold labelText="Text" type="text" handleClick={() => setModeIndex(1)}
                customTextStyle={{
                  elevation: 7,
                  textShadowColor: "#000",
                  textShadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  textShadowRadius: 20,
                }}
              />
            </SnapCarousel>
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
                  {!isRecording && false && <CrumbTypePicker maxSheetHeight={maxHeight} recMode={recMode} setRecMode={setRecMode} />}
                </>
              )}
            </View>
          )}
          <PreviewBunch />

          <CustomProfilePictureCircle
            size={40}
            customStyle={{
              position: "absolute",
              top: insets.top + 10,
              left: 15,
              zIndex: 11000,
            }}
            customTextStyle={{
              fontWeight: "700"
            }}
            handleClick={() => {
              router.push("/(protected)/profile-settings")
            }}
          />
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
