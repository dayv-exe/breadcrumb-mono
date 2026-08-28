import { useMediaStore } from "@/utils/mediaStore";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Reanimated from "react-native-reanimated";
import { useShallow } from "zustand/shallow";
import SmallPreviewCard from "./SmallPreviewCard";

interface props {
  style?: StyleProp<ViewStyle>
  size?: number
}

export default function PreviewBunch({ style, size }: props) {
  const SIZE = size ?? 1080 * 0.05
  const { mediaPreview, isRecording } =
    useMediaStore(
      useShallow((s) => ({
        mediaPreview: s.media,
        isRecording: s.isRecording,
      }))
    );

  return (
    <>
      {(
        <Reanimated.View style={[styles.previewContainer, style, {
          // width: SIZE,
          // height: SIZE,
        }]}>
          <View style={[styles.previewTouchable, {
            opacity: isRecording ? 0 : 1
          }]}>
            {mediaPreview.map((media, index) => {
              return (
                <SmallPreviewCard
                  key={index}
                  media={media}
                  index={index}
                  src={media.type === "video" && media.thumbnailUri ? media.thumbnailUri : media.localUri}
                  size={SIZE}
                  animateIn={index === mediaPreview.length - 1}
                />
              );
            })}
          </View>
        </Reanimated.View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
  },
  previewTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});