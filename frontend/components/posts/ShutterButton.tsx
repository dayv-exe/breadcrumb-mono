import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import RecordingProgressRing from "./recordingProgressRing";

type ShutterButtonProps = {
  isRecording: boolean;
  progress: SharedValue<number>;
  onTakePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

export default function ShutterButton({
  isRecording,
  progress,
  onTakePhoto,
  onStartRecording,
  onStopRecording,
}: ShutterButtonProps) {
  return (
    <View style={shutterStyles.container}>
      <View 
        style={[
          shutterStyles.outerRing, 
          { backgroundColor: isRecording ? "red" : "transparent" }
        ]}
        onTouchEnd={isRecording ? onStopRecording : undefined}
      >
        <TouchableOpacity
          delayLongPress={150}
          onPress={onTakePhoto}
          onLongPress={onStartRecording}
          style={[
            shutterStyles.innerButton,
            {
              borderColor: isRecording ? "transparent" : "#ccc",
              backgroundColor: "transparent",
            },
          ]}
        />
      </View>
      
      {isRecording && (
        <RecordingProgressRing 
          size={90} 
          strokeWidth={10} 
          progress={progress} 
        />
      )}
    </View>
  );
}

const shutterStyles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    bottom: 55,
  },
  outerRing: {
    borderRadius: "100%",
    padding: 10,
  },
  innerButton: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 7,
    width: 80,
    height: 80,
  },
});