import { FONT_SIZES } from "@/constants/appConstants";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FontSizePickerProps {
  currentSize: number;
  onSelect: (size: number) => void;
  onClose: () => void;
}

export default function FontSizePicker({
  currentSize,
  onSelect,
  onClose,
}: FontSizePickerProps) {
  return (
    <>
      <Text style={styles.title}>Font Size</Text>
      <View style={styles.fontSizeGrid}>
        {FONT_SIZES.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.fontSizeBtn,
              currentSize === size && styles.fontSizeBtnActive,
            ]}
            onPress={() => {
              onSelect(size);
              onClose();
            }}
          >
            <Text
              style={[
                styles.fontSizeBtnText,
                currentSize === size && styles.fontSizeBtnTextActive,
              ]}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
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
  fontSizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  fontSizeBtn: {
    width: 56,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeBtnActive: {
    backgroundColor: "#007AFF",
  },
  fontSizeBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  fontSizeBtnTextActive: {
    color: "#FFF",
  },
});