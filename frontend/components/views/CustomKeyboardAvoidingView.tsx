import { Colors } from "@/constants/Colors";
import { PropsWithChildren } from "react";
import { DimensionValue, KeyboardAvoidingView, StyleProp, StyleSheet, ViewStyle } from "react-native";

type ckavProps = {
  backgroundColor?: string
  verticalAlign?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined
  horizontalPadding?: DimensionValue
  verticalOffset?: number
  customStyle?: StyleProp<ViewStyle>
  pointerEvents?: "auto" | "box-none" | "none" | "box-only" | undefined
}

export default function CustomKeyboardAvoidingView({ children, backgroundColor = "#FFF", verticalAlign = "flex-start", horizontalPadding = 30, verticalOffset = 100, customStyle, pointerEvents }: PropsWithChildren<ckavProps>) {
  return (
    <KeyboardAvoidingView pointerEvents={pointerEvents} style={[
      styles.container,
      {
        backgroundColor: backgroundColor,
        justifyContent: verticalAlign,
        paddingHorizontal: horizontalPadding
      },
      customStyle
    ]} behavior="padding"
      keyboardVerticalOffset={verticalOffset}>
      {children}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.vibrantBackground,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 40,
    width: "100%"
  },
})