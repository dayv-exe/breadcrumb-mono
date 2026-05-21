import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";

type RadiusSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  unit?: "m" | "km" | "auto";
  hapticsEnabled?: boolean;
  width?: number | `${number}%`;
};

function formatRadius(value: number, unit: "m" | "km" | "auto"): string {
  if (unit === "m") return `${Math.round(value)} m`;
  if (unit === "km") return `${(value / 1000).toFixed(2)} km`;
  // auto
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `${Math.round(value)} m`;
}

export default function RadiusSlider({
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue = 15,
  maximumValue = 100,
  step = 10,
  label = "Radius",
  unit = "auto",
  hapticsEnabled = true,
  width = "100%",
}: RadiusSliderProps) {
  const mode = useColorScheme();
  const palette = mode === "dark" ? Colors.dark : Colors.light;
  const lastHapticStep = useRef<number>(value);

  const handleChange = (next: number) => {
    if (hapticsEnabled) {
      // fire a tick haptic every ~10% of the range so it doesn't spam
      const range = maximumValue - minimumValue;
      const tickSize = range / 20;
      if (Math.abs(next - lastHapticStep.current) >= tickSize) {
        Haptics.selectionAsync();
        lastHapticStep.current = next;
      }
    }
    onValueChange(next);
  };

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.row}>
        <CustomLabel
          adaptToTheme
          labelText={label + formatRadius(value, unit)}
          fontSize={15}
        />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={handleChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={palette.tint}
        maximumTrackTintColor={palette.fadedBackground}
        thumbTintColor={palette.darkenVibrant}
      />
      <View style={styles.row}>
        <CustomLabel
          fade
          adaptToTheme
          labelText={formatRadius(minimumValue, unit)}
          fontSize={15}
          textAlign="left"
        />
        <CustomLabel
          fade
          adaptToTheme
          labelText={formatRadius(maximumValue, unit)}
          fontSize={15}
          textAlign="right"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
  },
  slider: {
    width: "100%",
    height: 36,
  },
});