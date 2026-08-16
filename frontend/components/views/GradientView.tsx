import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

type GradientViewProps = {
  children?: React.ReactNode;

  colors: readonly [string, string, ...string[]];

  start?: { x: number; y: number };
  end?: { x: number; y: number };

  style?: StyleProp<ViewStyle>;
};

export default function GradientView({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
}: GradientViewProps) {
  return (
    <LinearGradient
    pointerEvents="box-none"
      colors={colors}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});