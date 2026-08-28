import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import { useModal } from "../modals/ModalContext";
import RecordingProgressRing from "../posts/recordingProgressRing";

type shutterProps = {
  takePhoto: () => void
  startRecording: () => void
  stopRecording: () => void
  recordingProgress: SharedValue<number>
  multiCrumbEnabled: boolean
}

export default function ShutterButton({ recordingProgress, startRecording, stopRecording, takePhoto, multiCrumbEnabled }: shutterProps) {
  const { isRecording, mediaPreview } = useMediaStore(
    useShallow(s => ({
      isRecording: s.isRecording,
      mediaPreview: s.media,
    }))
  )
  const { showModal, hideModal } = useModal()
  const handleTouchEnd = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  const handleCaptureMedia = (captureFunc: () => void) => {
    if (mediaPreview.length >= MAX_PREVIEW_MEDIA) {
      showModal({
        message: `Only ${MAX_PREVIEW_MEDIA} items max allowed!`,
        showCancelBtn: false,
        primaryBtnText: "Okay",
        onPrimary: () => {
          hideModal()
        }
      })
    } else {
      captureFunc()
    }
  }

  const handleTakePhoto = () => {
    handleCaptureMedia(takePhoto)
  }

  const handleStartRecording = () => {
    handleCaptureMedia(startRecording)
  }

  return (
    <View style={styles.shutterContainer}>
      <View onTouchEnd={handleTouchEnd} style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]}>
        <TouchableOpacity
          delayLongPress={150}
          onPress={handleTakePhoto}
          onLongPress={handleStartRecording}
          style={[styles.photoShutter, { borderColor: isRecording ? "transparent" : "#ddd", backgroundColor: isRecording ? "transparent" : "#FFF" }]}
        >

        </TouchableOpacity>
      </View>
      {isRecording && <RecordingProgressRing size={90} strokeWidth={10} progress={recordingProgress} />}
    </View>
  )
}

const styles = StyleSheet.create({
  shutterContainer: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  photoShutter: {
    borderRadius: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 7,
    width: 80,
    height: 80,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: .3,
    shadowRadius: 5,
  },
  videoShutter: {
    borderRadius: "100%",
    padding: 10
  },
  videoShutterInner: {

  },
})