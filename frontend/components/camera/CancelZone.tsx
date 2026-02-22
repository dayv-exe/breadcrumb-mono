import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

type CancelZoneProps = {
  visible: boolean;
  active: boolean;
  onLayout: (e: LayoutChangeEvent) => void;
};

export default function CancelZone({ visible, active, onLayout }: CancelZoneProps) {
  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[
        styles.cancelZone,
        {
          opacity: visible ? 1 : 0,
          backgroundColor: active
            ? "rgba(255,59,48,0.85)"
            : "rgba(0,0,0,0.6)",
          transform: [{ scale: active ? 1.15 : 1 }],
        },
      ]}
    >
      <Text style={[styles.cancelText, { fontSize: active ? 15 : 13 }]}>
        {active ? "Release to cancel" : "⬆ Swipe up to cancel"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelZone: {
    position: "absolute",
    bottom: 140,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    alignSelf: "center",
    zIndex: 10,
  },
  cancelText: {
    color: "#FFF",
    fontWeight: "600",
  },
});