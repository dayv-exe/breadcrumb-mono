import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { Friend, useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import { useModal } from "../modals/ModalContext";
import RecordingProgressRing from "../posts/recordingProgressRing";

const friends: Friend[] = [
  { id: '1', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?img=1', isOnline: true },
  { id: '2', name: 'Mike', avatar: 'https://i.pravatar.cc/150?img=2', isOnline: false },
  { id: '3', name: 'Emma', avatar: 'https://i.pravatar.cc/150?img=3', isOnline: true },
  { id: '4', name: 'John', avatar: 'https://i.pravatar.cc/150?img=4', isOnline: false },
  { id: '5', name: 'Lisa', avatar: 'https://i.pravatar.cc/150?img=5', isOnline: true },
];

type shutterProps = {
  takePhoto: () => void
  startRecording: () => void
  stopRecording: () => void
  recordingProgress: SharedValue<number>
}

export default function ShutterButton({ recordingProgress, startRecording, stopRecording, takePhoto }: shutterProps) {
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