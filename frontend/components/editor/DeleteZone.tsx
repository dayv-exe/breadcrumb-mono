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

const ZONE_SIZE = 64;

export default function DeleteZone({
  visible,
  active,
  onLayout,
  style,
}: DeleteZoneProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    transform: [
      { scale: withSpring(active ? 1.4 : 1, { damping: 12, stiffness: 180 }) },
    ],
  }));

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.zone, style, animatedStyle]}
      pointerEvents="none"
    >
      <Ionicons
        name={active ? "trash" : "trash-outline"}
        size={28}
        color="#fff"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    bottom: 100,
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