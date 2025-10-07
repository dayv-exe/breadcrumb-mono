import { buttonTypes } from "@/constants/buttonTypes";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState } from "react";
import { ActivityIndicator, AnimatableNumericValue, DimensionValue, Image, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import Spacer from "../Spacer";

type bProps = {
  labelText?: string
  type?: buttonTypes
  fontSize?: number
  width?: DimensionValue
  imgSrc?: any
  imgSize?: number
  adaptToTheme?: boolean
  disabled?: boolean
  allowMultipleClicks?: boolean
  isPending?: boolean
  squashed?: boolean
  borderRadius?: string | AnimatableNumericValue
  slim?: boolean
  bold?: boolean
  paddingHorizontal?: DimensionValue
  handleClick?: () => void
  debounceTime?: number
  customStyle?: StyleProp<ViewStyle>
}

export default function CustomButton({ labelText = "button", type = "faded", width = "auto", handleClick = () => { }, adaptToTheme = false, disabled = false, allowMultipleClicks = false, isPending = false, debounceTime = 500, slim = false, squashed = false, bold = true, imgSrc, borderRadius = 15, imgSize = 21, paddingHorizontal, fontSize, customStyle }: bProps) {
  const theme = useThemeColor
  const mode = useColorScheme()
  const [clicked, setClicked] = useState(false)
  const bgCol = () => {
    switch (type) {
    case "prominent":
      return Colors.light.vibrantButton

    case "faded":
      return "rgba(255, 255, 255, 0.1)"

    case "dark-faded":
      return Colors.light.text

    case "theme-faded":
      return theme({}, "fadedBackground")

    case "less-prominent":
      return theme({}, "darkenVibrant")

    case "themed":
      return theme({}, "background")

    default:
      return "transparent"
  }
  }
  const backgroundColor = bgCol()

  const getTextColor = () => {
    return type === "vibrant-text" ? Colors.light.vibrantButton :
      type === "less-vibrant-text" ? Colors.light.darkenVibrant :
        adaptToTheme || type === "theme-faded" ? (mode === "dark" ? Colors.dark.text : Colors.light.text) :
          type === "dark-faded" ? Colors.light.text : "#fff"
  }

  // debounce
  const resetClick = async () => {
    setTimeout(() => { setClicked(false) }, debounceTime)
  }

  return (
    <TouchableOpacity disabled={disabled} onPress={() => {
      // debounce clicks and disable clicks is button is in loading state
      if (!clicked) {
        if (!allowMultipleClicks) { setClicked(true) }
        if (!isPending) {
          handleClick()
          resetClick()
        }
      }
    }} style={[
      styles.button,
      {
        backgroundColor: disabled ? Colors.dark.tabIconDefault : backgroundColor,
        height: slim ? 43 : "auto",
        width: width,
        padding: squashed ? 6 : slim ? 10 : 15,
        paddingHorizontal: paddingHorizontal ? paddingHorizontal : squashed ? 13 : slim ? 10 : 15,
        borderRadius: borderRadius,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      },
      customStyle
    ]}>
      {isPending &&
        <>
          <ActivityIndicator color={getTextColor()} />
          <Spacer size="small" />
        </>
      }
      {imgSrc && <>
        <Image source={imgSrc} style={{
          width: imgSize,
          height: imgSize
        }} />
        {labelText && <Spacer size="small" />}
      </>}
      {labelText && <Text style={[
        styles.text,
        {
          color: getTextColor(),
          fontSize: fontSize ? fontSize :  squashed ? 13 : slim ? 14 : 15,
          fontWeight: bold ? 600 : "normal",
        }
      ]}>{labelText}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
    textAlign: "center"
  },
})