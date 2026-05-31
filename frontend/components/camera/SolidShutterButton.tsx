import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import { useModal } from "../modals/ModalContext";
import RecordingProgressRing from "../posts/recordingProgressRing";

type solidShutterProps = {
  takePhoto: () => void
  startRecording: () => void
  stopRecording: () => void
  recordingProgress: SharedValue<number>
}

export default function SolidShutterButton({ recordingProgress, startRecording, stopRecording, takePhoto }: solidShutterProps) {
  const { isRecording, mediaPreview, setShowMediaPreviews } = useMediaStore(
    useShallow(s => ({
      isRecording: s.isRecording,
      mediaPreview: s.mediaPreview,
      setShowMediaPreviews: s.setShowMediaPreviews
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
          setShowMediaPreviews(true)
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
      {/* {!isRecording && <FriendCarousel
        friends={friends}
        customStyle={{
          position: "absolute",
          width: "100%",
        }}
      />} */}
      <View style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]} onTouchEnd={handleTouchEnd}>
        <TouchableOpacity
          delayLongPress={150}
          onPress={handleTakePhoto}
          onLongPress={handleStartRecording}
          style={[styles.photoShutter, { borderColor: isRecording ? "transparent" : "rgba(0, 0, 0, .25)", backgroundColor: isRecording ? "transparent" : "white" }]}
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
    borderWidth: 7,
    width: 85,
    height: 85,
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