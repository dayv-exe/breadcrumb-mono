import { useDropZone } from "@/hooks/useDropZone";
import { useMediaStore } from "@/utils/mediaStore";
import { useMemo, useRef } from "react";
import { Image, PanResponder, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import AudioRecButton from "../camera/AudioRecButton";
import CancelZone from "../camera/CancelZone";
import CustomLabel from "../CustomLabel";

type Props = {
  recordingProgress: SharedValue<number>;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
};

export default function RecordCrumb({
  recordingProgress,
  startRecording,
  stopRecording,
  cancelRecording,
}: Props) {
  const isRecording = useMediaStore((s) => s.isRecording);

  const isDraggingRef = useRef(false);
  const droppedRef = useRef(false);
  const DRAG_THRESHOLD = 20;

  const cancelZone = useDropZone({
    hitSlop: 25,
    onDrop: () => {
      droppedRef.current = true;
      cancelRecording();
    },
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return isRecording && gestureState.dy < -DRAG_THRESHOLD;
        },
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          droppedRef.current = false;
          cancelZone.handleDragStart();
        },
        onPanResponderMove: (evt) => {
          if (!isDraggingRef.current) return;
          cancelZone.handleDragMove(
            evt.nativeEvent.pageX,
            evt.nativeEvent.pageY
          );
        },
        onPanResponderRelease: (evt) => {
          if (!isDraggingRef.current) return;
          cancelZone.handleDragEnd(
            evt.nativeEvent.pageX,
            evt.nativeEvent.pageY
          );
          if (!droppedRef.current) {
            stopRecording();
          }
          isDraggingRef.current = false;
        },
        onPanResponderTerminate: () => {
          if (isDraggingRef.current) {
            stopRecording();
          }
          isDraggingRef.current = false;
          cancelZone.handleDragEnd(0, 0);
        },
      }),
    [
      isRecording,
      stopRecording,
      cancelZone.handleDragStart,
      cancelZone.handleDragMove,
      cancelZone.handleDragEnd,
    ]
  );

  const handleTouchEnd = () => {
    if (isRecording && !isDraggingRef.current) {
      stopRecording();
    }
  };

  return (
    <View style={style.container} {...panResponder.panHandlers}>
      <CustomLabel
        labelText={!isRecording ? "Record a crumb" : "Recording..."}
        fontSize={18}
      />
      <Image
        style={{ opacity: 0.5, width: 70, height: 70 }}
        source={require("../../assets/images/icons/recording_sel_light.png")}
      />
      <CustomLabel
        labelText={
          !isRecording
            ? "Press and hold"
            : "Release to stop · Swipe up to cancel"
        }
        fade
      />

      <AudioRecButton
        recordingProgress={recordingProgress}
        startRecording={startRecording}
        onTouchEnd={handleTouchEnd}
      />

      <CancelZone
        visible={cancelZone.isVisible}
        active={cancelZone.isActive}
        onLayout={cancelZone.onLayout}
      />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
  },
});