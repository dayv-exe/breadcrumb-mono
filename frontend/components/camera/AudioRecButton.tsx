import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useMediaStore } from "@/utils/mediaStore";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import CustomLabel from "../CustomLabel";
import { useModal } from "../modals/ModalContext";
import RecordingProgressRing from "../posts/recordingProgressRing";

type audioRecButtonProps = {
  startRecording: () => void
  recordingProgress: SharedValue<number>
}

export default function AudioRecordButton({ recordingProgress, startRecording, }: audioRecButtonProps) {
  const { isRecording, mediaPreview, setShowMediaPreviews } = useMediaStore(
    useShallow(s => ({
      isRecording: s.isRecording,
      mediaPreview: s.mediaPreview,
      setShowMediaPreviews: s.setShowMediaPreviews
    }))
  )
  const { showModal, hideModal } = useModal()
  const handleStartRecording = () => {
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
      if (isRecording) return
      startRecording()
    }
  }

  return (
    <View style={styles.shutterContainer}>
      <View style={[styles.promptContainer, {
        top: isRecording ? -50 : -40
      }]}>
        {!isRecording && <CustomLabel labelText={isRecording ? "Swipe up to cancel" : "Press and hold"} textAlign="center" customStyle={styles.promptText} fade />}
        {isRecording && <Image style={styles.promptImg} source={require("../../assets/images/icons/upup_unsel_light.png")} />}
      </View>
      <View style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]}>
        <TouchableOpacity
          delayLongPress={100}
          onLongPress={handleStartRecording}
          style={[styles.photoShutter, { borderColor: isRecording ? "transparent" : "#FFF", backgroundColor: isRecording ? "transparent" : "transparent" }]}
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
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    bottom: 30,
    width: "100%",
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
  promptContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  promptText: {

  },
  promptImg: {
    width: 30,
    height: 30,
  },
})