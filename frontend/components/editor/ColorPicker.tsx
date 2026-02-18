import { PRESET_COLORS } from "@/constants/appConstants";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ColorPickerProps {
  currentColor: string;
  title: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({
  currentColor,
  title,
  onSelect,
  onClose,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState("");

  const handleApplyCustom = () => {
    const hex = customColor.startsWith("#") ? customColor : `#${customColor}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onSelect(hex);
      onClose();
    } else {
      Alert.alert("Invalid color", "Enter a valid hex like #FF5500");
    }
  };

  return (
    <>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.colorGrid}>
        {PRESET_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              currentColor === color && styles.colorSwatchSelected,
            ]}
            onPress={() => {
              onSelect(color);
              onClose();
            }}
          />
        ))}
      </View>

      <View style={styles.customColorRow}>
        <Text style={styles.label}>Custom hex:</Text>
        <TextInput
          style={styles.hexInput}
          value={customColor}
          onChangeText={setCustomColor}
          placeholder="#RRGGBB"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={7}
        />
        <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCustom}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 16,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  colorSwatchSelected: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  customColorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#333",
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  applyBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  applyBtnText: {
    color: "#FFF",
    fontWeight: "600",
  },
});