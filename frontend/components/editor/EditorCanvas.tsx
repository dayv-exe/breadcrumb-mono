import { EditorState } from "@/constants/media";
import React, { forwardRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface EditorCanvasProps {
  editor: EditorState;
  onChangeText: (text: string) => void;
}

const EditorCanvas = forwardRef<View, EditorCanvasProps>(({ editor, onChangeText }, ref) => {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.editorWrapper, { backgroundColor: editor.bgColor }]}
    >
      <TextInput
        style={[
          styles.textInput,
          {
            color: editor.textColor,
            fontSize: editor.fontSize,
            fontStyle: editor.fontStyle,
            fontWeight: editor.fontWeight,
          },
        ]}
        value={editor.text}
        onChangeText={onChangeText}
        placeholder="Start typing..."
        placeholderTextColor={editor.textColor + "55"}
        multiline
        textAlignVertical="top"
        scrollEnabled
      />
    </View>
  );
});

EditorCanvas.displayName = "EditorCanvas";

const styles = StyleSheet.create({
  editorWrapper: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInput: {
    flex: 1,
    padding: 20,
    minHeight: 300,
  },
});

export default React.memo(EditorCanvas);