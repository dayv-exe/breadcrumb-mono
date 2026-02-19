import { EditorState } from "@/constants/media";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import CustomKeyboardAvoidingView from "../views/CustomKeyboardAvoidingView";

const INITIAL_STATE: EditorState = {
  text: "",
  bgColor: "#FFFFFF",
  textColor: "#000000",
  fontSize: 31,
  fontStyle: "normal",
  fontWeight: "normal",
};

function TypingArea({ fontSize, fontColor }: { fontSize: number, fontColor: string }) {
  const [text, setText] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  return (
    <CustomKeyboardAvoidingView verticalOffset={70} customStyle={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <TextInput
        ref={inputRef}
        placeholder="Start typing..."
        value={text}
        onChangeText={setText}
        multiline
        style={{
          fontSize: fontSize,
          color: fontColor,
          textAlign: "center"
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {isFocused && <CustomButton labelText="Done" type="less-prominent" handleClick={() => {
        inputRef.current?.blur()
      }} />}
    </CustomKeyboardAvoidingView>
  )
}


export default function CustomTextEditor() {
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [editor, setEditor] = useState<EditorState>(INITIAL_STATE)

  return (
    <View style={[styles.container, {
      backgroundColor: editor.bgColor,
      height: height
    }]}>
      <TypingArea fontColor={editor.textColor} fontSize={editor.fontSize} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})