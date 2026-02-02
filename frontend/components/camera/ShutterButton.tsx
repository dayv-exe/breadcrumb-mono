import { Friend, useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import RecordingProgressRing from "../posts/recordingProgressRing";
import FriendCarousel from "./FriendCarousel";

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
  const { isRecording, setSelectedFriend } = useMediaStore()
  const handleTouchEnd = () => {
    if (isRecording) {
      stopRecording()
    }
  }

  return (
    <View style={styles.shutterContainer}>
      {!isRecording && <FriendCarousel
        friends={friends}
        onFriendChange={f => { setSelectedFriend(f) }}
        customStyle={{
          position: "absolute",
          width: "100%",
        }}
      />}
      <View style={[styles.videoShutter, { backgroundColor: isRecording ? "red" : "transparent" }]} onTouchEnd={handleTouchEnd}>
        <TouchableOpacity
          delayLongPress={150}
          onPress={takePhoto}
          onLongPress={startRecording}
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
    bottom: 15,
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
  videoShutterInner: {

  },
})