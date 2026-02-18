import { useEditorModals } from "@/hooks/useEditorModals";
import { useEditorState } from "@/hooks/useEditorState";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EditorCanvas from "./EditorCanvas";
import EditorToolbar from "./EditorToolbar";

const TextEditor: React.FC = () => {
  const captureViewRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  const {
    editor,
    toggleBold,
    toggleItalic,
    setText,
    setBgColor,
    setTextColor,
    setFontSize,
  } = useEditorState();

  const { openBgColorPicker, openTextColorPicker, openFontSizePicker } =
    useEditorModals({
      bgColor: editor.bgColor,
      textColor: editor.textColor,
      fontSize: editor.fontSize,
      onBgColorSelect: setBgColor,
      onTextColorSelect: setTextColor,
      onFontSizeSelect: setFontSize,
    });

  const handleSave = () => {
    // TODO: implement save/export
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <EditorToolbar
        editor={editor}
        isSaving={isSaving}
        onOpenBgColor={openBgColorPicker}
        onOpenTextColor={openTextColorPicker}
        onOpenFontSize={openFontSizePicker}
        onToggleBold={toggleBold}
        onToggleItalic={toggleItalic}
        onSave={handleSave}
      />

      <EditorCanvas
        ref={captureViewRef}
        editor={editor}
        onChangeText={setText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TextEditor;