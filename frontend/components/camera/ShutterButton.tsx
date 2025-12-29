import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import RecordingProgressRing from "../posts/recordingProgressRing";

type shutterProps = {
  takePhoto: () => void
  startRecording: () => void
  stopRecording: () => void
  recordingProgress: SharedValue<number>
}

export default function ShutterButton({ recordingProgress, startRecording, stopRecording, takePhoto }: shutterProps) {
  const { isRecording } = useMediaStore()
  const handleTouchEnd = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  return (
    <View style={styles.shutterContainer}>
      <View style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]} onTouchEnd={handleTouchEnd}>
        <TouchableOpacity
          delayLongPress={150}
          onPress={takePhoto}
          onLongPress={startRecording}
          style={[styles.photoShutter, { borderColor: isRecording ? "transparent" : "#ccc", backgroundColor: isRecording ? "transparent" : "transparent" }]}
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
    bottom: 20,
  },
  photoShutter: {
    borderRadius: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 7,
    width: 80,
    height: 80,
  },
  videoShutter: {
    borderRadius: "100%",
    padding: 10
  },
  videoShutterInner: {

  },
})