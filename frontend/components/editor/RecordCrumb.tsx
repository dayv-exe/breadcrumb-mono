import { useDropZone } from "@/hooks/useDropZone";
import { useMediaStore } from "@/utils/mediaStore";
import * as Haptics from "expo-haptics";
import { Image, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureStateChangeEvent, PanGestureHandlerEventPayload } from "react-native-gesture-handler";
import { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import CustomLabel from "../CustomLabel";
import AudioRecordButton from "../camera/AudioRecButton";
import DeleteZone from "./DeleteZone";

type props = {
  startRecording: () => void
  finishAudioRecording: () => void
  cancelAudioRecording: () => void
  recordingProgress: SharedValue<number>
}

export default function RecordCrumb({ startRecording, finishAudioRecording, cancelAudioRecording, recordingProgress }: props) {
  const isRecording = useMediaStore(s => s.isRecording)
  const deleteZone = useDropZone({
    hitSlop: 25,
    onEnter: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  })

  const handleTouchEnd = (t: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
    if (deleteZone.isActive) {
      cancelAudioRecording()
    } else {
      finishAudioRecording()
    }
  }

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(e => {
      if (!isRecording) return
      scheduleOnRN(deleteZone.handleDragStart)
    })
    .onUpdate(e => {
      if (!isRecording) return;
      scheduleOnRN(deleteZone.handleDragMove, e.x, e.y)
    })
    .onEnd(e => {
      if (!isRecording) return
      scheduleOnRN(handleTouchEnd, e)
    })

  return (
    <GestureDetector gesture={gesture}>
      <View style={style.container} onTouchEnd={() => {
        if (!isRecording) return
        finishAudioRecording()
      }}>
        <CustomLabel labelText="Record a crumb" fontSize={18} customStyle={{opacity: 0}} />
        <Image style={style.image} source={require("../../assets/images/icons/recording_sel_light.png")} />
        <CustomLabel labelText="" />
        <DeleteZone
          active={deleteZone.isActive}
          visible={isRecording}
          onLayout={deleteZone.onLayout}
          style={{ bottom: 200, backgroundColor: "rgba(255, 255, 255, .25)" }}
        />
        <AudioRecordButton startRecording={startRecording} recordingProgress={recordingProgress} />
      </View>
    </GestureDetector>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  image: {
    width: 70,
    height: 70,
    opacity: .5,
  }
})