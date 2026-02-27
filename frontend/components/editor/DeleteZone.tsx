import { useMediaStore } from "@/utils/mediaStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type DeleteZoneProps = {
  visible: boolean;
  active: boolean;
  onLayout?: (e: any) => void;
  style?: ViewStyle;
};

const ZONE_SIZE = 45;

export default function DeleteZone({
  visible,
  active,
  onLayout,
  style,
}: DeleteZoneProps) {
  const previews = useMediaStore(s => s.mediaPreview)
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    transform: [
      { scale: withSpring(active ? 1.5 : 1, { damping: 12, stiffness: 180 }) },
    ],
  }));

  return (
    <Animated.View
      onLayout={onLayout}
      style={[{
        bottom: previews.length > 1 ? 90 : 20
      }, styles.zone, style, animatedStyle]}
      pointerEvents="none"
    >
      <Ionicons
        name={active ? "trash" : "trash-outline"}
        size={23}
        color="#fff"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    width: ZONE_SIZE,
    height: ZONE_SIZE,
    borderRadius: ZONE_SIZE / 2,
    backgroundColor: "rgba(255, 59, 48, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100000,
  },
});