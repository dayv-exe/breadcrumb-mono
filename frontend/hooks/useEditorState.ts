import { EditorState } from "@/constants/media";
import { useCallback, useState } from "react";

const INITIAL_STATE: EditorState = {
  text: "",
  bgColor: "#FFFFFF",
  textColor: "#000000",
  fontSize: 18,
  fontStyle: "normal",
  fontWeight: "normal",
};

export function useEditorState() {
  const [editor, setEditor] = useState<EditorState>(INITIAL_STATE);

  const updateField = useCallback(
    <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
      setEditor((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleBold = useCallback(() => {
    setEditor((prev) => ({
      ...prev,
      fontWeight: prev.fontWeight === "bold" ? "normal" : "bold",
    }));
  }, []);

  const toggleItalic = useCallback(() => {
    setEditor((prev) => ({
      ...prev,
      fontStyle: prev.fontStyle === "italic" ? "normal" : "italic",
    }));
  }, []);

  const setText = useCallback((text: string) => {
    setEditor((prev) => ({ ...prev, text }));
  }, []);

  const setBgColor = useCallback((bgColor: string) => {
    setEditor((prev) => ({ ...prev, bgColor }));
  }, []);

  const setTextColor = useCallback((textColor: string) => {
    setEditor((prev) => ({ ...prev, textColor }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setEditor((prev) => ({ ...prev, fontSize }));
  }, []);

  return {
    editor,
    updateField,
    toggleBold,
    toggleItalic,
    setText,
    setBgColor,
    setTextColor,
    setFontSize,
  };
}