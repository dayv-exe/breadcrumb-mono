import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, TouchableOpacity } from "react-native";
import Reanimated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import PreviewCard from "./PreviewCard";

export default function PreviewBunch() {
  const { setShowMediaPreviews, mediaPreview, selectedFriend, isRecording } =
    useMediaStore(
      useShallow((s) => ({
        setShowMediaPreviews: s.setShowMediaPreviews,
        mediaPreview: s.mediaPreview,
        selectedFriend: s.selectedFriend,
        isRecording: s.isRecording,
      }))
    );
  const previewContainerStyle = useAnimatedStyle(() => {
    return {
      bottom: withSpring(!selectedFriend ? 95 : 180, {
        damping: 25,
        stiffness: 250,
        mass: 1
      }),
      left: withSpring(!selectedFriend ? 70 : 45, {
        damping: 25,
        stiffness: 250,
        mass: 1,
      }),
    };
  }, [selectedFriend]);

  return (
    <>
      {!isRecording && (
        <Reanimated.View style={[styles.previewContainer, previewContainerStyle]}>
          <TouchableOpacity onPress={() => setShowMediaPreviews(true)} style={styles.previewTouchable}>
            {mediaPreview.map((media, index) => {
              return <PreviewCard index={index} src={media.type === "video" && media.thumbnail ? media.thumbnail : media.uri} key={index} active />;
            })}
          </TouchableOpacity>
        </Reanimated.View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  previewContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
  },
  previewTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
