import { useThemeColor } from "@/hooks/useThemeColor";
import { ColorValue, DimensionValue, StyleProp, StyleSheet, Text, TextStyle } from "react-native";

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
  customStyle?: StyleProp<TextStyle>
  allowTruncate?: boolean
}

export default function CustomLabel({ labelText = "Label", textAlign = "left", adaptToTheme = false, bold = false, fade = false, fitContent = true, width = "100%", fontSize = 17, italic = false, padding = 0, textColor, customStyle, allowTruncate }: lProps) {
  const textCol = useThemeColor({}, "text")
  return (
    <Text
      numberOfLines={allowTruncate ? 1 : undefined}
      ellipsizeMode={allowTruncate ? "tail" : undefined}
      style={[
        styles.labelText,
        {
          color: adaptToTheme ? textCol : textColor ? textColor : "#fff",
          fontWeight: bold ? "600" : "regular",
          textAlign: textAlign,
          opacity: fade ? .7 : 1,
          width: fitContent ? "auto" : width,
          fontSize: fontSize,
          fontStyle: italic ? "italic" : "normal",
          padding: padding,
        }
        , customStyle]}>{labelText}</Text>
  )
}

const baseLabel: TextStyle = {
  width: "100%",
  fontSize: 16,
  flexShrink: 1,
}

const styles = StyleSheet.create({
  labelText: {
    ...baseLabel,
  },
})