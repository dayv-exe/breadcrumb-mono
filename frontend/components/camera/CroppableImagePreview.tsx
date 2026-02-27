import { clamp, maxPanForScale, panNormToTranslatePx, translatePxToPanNorm } from "@/utils/CropHelper";
import { Image } from "expo-image"; // if you're using expo-image
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const AnimatedImage = Animated.createAnimatedComponent(Image);

type Props = {
  uri: string;
  enabled: boolean; // only allow gestures when cropping is enabled
  containerWidth: number;
  containerHeight: number;

  // current crop from your store
  crop?: { enabled: boolean; scale: number; pan: { x: number; y: number } };

  // call into zustand to persist
  onCropChange?: (crop: { enabled: boolean; scale: number; pan: { x: number; y: number } }) => void;
};

export function CroppableImagePreview({
  uri,
  enabled,
  containerWidth,
  containerHeight,
  crop,
  onCropChange,
}: Props) {
  // Shared values for smooth gestures
  const scale = useSharedValue(crop?.scale ?? 1);
  const panX = useSharedValue(crop?.pan.x ?? 0); // normalized
  const panY = useSharedValue(crop?.pan.y ?? 0); // normalized

  // Keep shared values in sync when currentMedia changes
  useEffect(() => {
    scale.value = crop?.scale ?? 1;
    panX.value = crop?.pan.x ?? 0;
    panY.value = crop?.pan.y ?? 0;
  }, [uri, crop?.scale, crop?.pan.x, crop?.pan.y]);

  const commit = () => {
    if (!onCropChange) return;
    onCropChange({
      enabled: true,
      scale: scale.value,
      pan: { x: panX.value, y: panY.value },
    });
  };

  // PAN (translate in px, then convert to normalized pan)
  const panStartX = useSharedValue(0); // normalized
  const panStartY = useSharedValue(0); // normalized

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      panStartX.value = panX.value;
      panStartY.value = panY.value;
    })
    .onUpdate((e) => {
      if (!containerWidth || !containerHeight) return;

      // convert gesture translation (px) into normalized delta
      const deltaPanX = translatePxToPanNorm(e.translationX, containerWidth, scale.value);
      const deltaPanY = translatePxToPanNorm(e.translationY, containerHeight, scale.value);

      const maxPan = maxPanForScale(scale.value);

      panX.value = clamp(panStartX.value + deltaPanX, -maxPan, maxPan);
      panY.value = clamp(panStartY.value + deltaPanY, -maxPan, maxPan);
    })
    .onEnd(() => {
      scheduleOnRN(commit);
    });

  // PINCH
  const pinchStartScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .enabled(enabled)
    .onBegin(() => {
      pinchStartScale.value = scale.value;
    })
    .onUpdate((e) => {
      const nextScale = clamp(pinchStartScale.value * e.scale, 1, 8);
      scale.value = nextScale;

      // clamp pan after scale changes
      const maxPan = maxPanForScale(scale.value);
      panX.value = clamp(panX.value, -maxPan, maxPan);
      panY.value = clamp(panY.value, -maxPan, maxPan);
    })
    .onEnd(() => {
      scheduleOnRN(commit);
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const tx = panNormToTranslatePx(panX.value, containerWidth, scale.value);
    const ty = panNormToTranslatePx(panY.value, containerHeight, scale.value);

    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.cropFrame}>
        <AnimatedImage
          source={{ uri }}
          style={[styles.media, animatedStyle]}
          contentFit="cover"
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cropFrame: {
    width: "100%",
    height: "100%",
    overflow: "hidden", // ✅ critical for crop frame
    backgroundColor: "black",
  },
  media: {
    width: "100%",
    height: "100%",
  },
});