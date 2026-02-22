import { MAX_PREVIEW_MEDIA } from "@/constants/appConstants";
import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import { useModal } from "../modals/ModalContext";
import RecordingProgressRing from "../posts/recordingProgressRing";

type AudioRecProps = {
  startRecording: () => void;
  onTouchEnd: () => void;
  recordingProgress: SharedValue<number>;
};

export default function AudioRecButton({
  recordingProgress,
  startRecording,
  onTouchEnd,
}: AudioRecProps) {
  const { isRecording, mediaPreview, setShowMediaPreviews } = useMediaStore(
    useShallow((s) => ({
      isRecording: s.isRecording,
      mediaPreview: s.mediaPreview,
      setShowMediaPreviews: s.setShowMediaPreviews,
    }))
  );
  const { showModal, hideModal } = useModal();

  const handleCaptureMedia = (captureFunc: () => void) => {
    if (mediaPreview.length >= MAX_PREVIEW_MEDIA) {
      showModal({
        message: `Only ${MAX_PREVIEW_MEDIA} items max allowed per crumb!`,
        showCancelBtn: false,
        primaryBtnText: "Okay",
        onPrimary: () => {
          setShowMediaPreviews(true);
          hideModal();
        },
      });
    } else {
      captureFunc();
    }
  };

  const handleStartRecording = () => {
    handleCaptureMedia(startRecording);
  };

  return (
    <View style={styles.shutterContainer}>
      <View
        style={[
          styles.videoShutter,
          { backgroundColor: isRecording ? "red" : "transparent" },
        ]}
        onTouchEnd={onTouchEnd}
      >
        <TouchableOpacity
          delayLongPress={75}
          onLongPress={handleStartRecording}
          style={[
            styles.photoShutter,
            {
              borderColor: isRecording ? "transparent" : "#FFF",
              backgroundColor: "transparent",
            },
          ]}
        />
      </View>
      {isRecording && (
        <RecordingProgressRing
          size={90}
          strokeWidth={10}
          progress={recordingProgress}
        />
      )}
    </View>
  );
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
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 7,
    width: 80,
    height: 80,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  videoShutter: {
    borderRadius: 9999,
    padding: 10,
  },
});