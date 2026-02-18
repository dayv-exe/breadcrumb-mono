import { EditorState } from "@/constants/media";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EditorToolbarProps {
  editor: EditorState;
  isSaving: boolean;
  onOpenBgColor: () => void;
  onOpenTextColor: () => void;
  onOpenFontSize: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onSave: () => void;
}

export default function EditorToolbar({
  editor,
  isSaving,
  onOpenBgColor,
  onOpenTextColor,
  onOpenFontSize,
  onToggleBold,
  onToggleItalic,
  onSave,
}: EditorToolbarProps) {
  const isBold = editor.fontWeight === "bold";
  const isItalic = editor.fontStyle === "italic";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.toolbar}
      contentContainerStyle={styles.toolbarContent}
    >
      {/* BG Color */}
      <TouchableOpacity style={styles.toolBtn} onPress={onOpenBgColor}>
        <View style={[styles.colorPreview, { backgroundColor: editor.bgColor }]} />
        <Text style={styles.toolLabel}>BG</Text>
      </TouchableOpacity>

      {/* Text Color */}
      <TouchableOpacity style={styles.toolBtn} onPress={onOpenTextColor}>
        <View style={[styles.colorPreview, { backgroundColor: editor.textColor }]} />
        <Text style={styles.toolLabel}>Text</Text>
      </TouchableOpacity>

      {/* Font Size */}
      <TouchableOpacity style={styles.toolBtn} onPress={onOpenFontSize}>
        <Text style={styles.toolIcon}>{editor.fontSize}</Text>
        <Text style={styles.toolLabel}>Size</Text>
      </TouchableOpacity>

      {/* Bold */}
      <TouchableOpacity
        style={[styles.toolBtn, isBold && styles.toolBtnActive]}
        onPress={onToggleBold}
      >
        <Text style={[styles.toolIcon, { fontWeight: "bold" }, isBold && styles.toolIconActive]}>
          B
        </Text>
        <Text style={[styles.toolLabel, isBold && styles.toolLabelActive]}>Bold</Text>
      </TouchableOpacity>

      {/* Italic */}
      <TouchableOpacity
        style={[styles.toolBtn, isItalic && styles.toolBtnActive]}
        onPress={onToggleItalic}
      >
        <Text style={[styles.toolIcon, { fontStyle: "italic" }, isItalic && styles.toolIconActive]}>
          I
        </Text>
        <Text style={[styles.toolLabel, isItalic && styles.toolLabelActive]}>Italic</Text>
      </TouchableOpacity>

      {/* Save */}
      <TouchableOpacity
        style={[styles.toolBtn, styles.saveBtn]}
        onPress={onSave}
        disabled={isSaving}
      >
        <Text style={styles.saveBtnText}>{isSaving ? "..." : "Save"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    maxHeight: 72,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  toolbarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 50,
  },
  toolBtnActive: {
    backgroundColor: "#007AFF",
  },
  toolIcon: {
    fontSize: 18,
    color: "#333",
  },
  toolIconActive: {
    color: "#FFF",
  },
  toolLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  toolLabelActive: {
    color: "#FFF",
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCC",
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});