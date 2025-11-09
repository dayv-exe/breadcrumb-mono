import { useThemeColor } from "@/hooks/useThemeColor";
import { ColorValue, DimensionValue, StyleSheet, Text, TextStyle } from "react-native";

type tAlign = "left" | "right" | "center"

type lProps = {
  labelText?: string,
  textAlign?: tAlign
  fontSize?: number
  padding?: number
  width?: DimensionValue
  bold?: boolean
  italic?: boolean
  fade?: boolean
  adaptToTheme?: boolean
  fitContent?: boolean
  textColor?: ColorValue
}

export default function CustomLabel({ labelText = "Label", textAlign = "left", adaptToTheme = false, bold = false, fade = false, fitContent = false, width = "100%", fontSize = 17, italic = false, padding = 5, textColor }: lProps) {
  const textCol = useThemeColor({}, "text")
  return (
    <Text style={[
      styles.labelText,
      {
        color: adaptToTheme ? textCol : textColor ? textColor : "#fff",
        fontWeight: bold ? "600" : "normal",
        textAlign: textAlign,
        opacity: fade ? .7 : 1,
        width: fitContent ? "auto" : width,
        fontSize: fontSize,
        fontStyle: italic ? "italic" : "normal",
        padding: padding,
      }
    ]}>{labelText}</Text>
  )
}

const baseLabel: TextStyle = {
  width: "100%",
  fontSize: 16,
  flexShrink: 1
}

const styles = StyleSheet.create({
  labelText: {
    ...baseLabel,
  },
})