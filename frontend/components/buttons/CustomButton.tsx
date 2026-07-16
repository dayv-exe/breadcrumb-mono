import { buttonTypes } from "@/constants/buttonTypes";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PropsWithChildren, useState } from "react";
import { ActivityIndicator, AnimatableNumericValue, DimensionValue, Image, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";
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
  useMinWidth?: boolean
  slim?: boolean
  bold?: boolean
  freed?: boolean
  paddingHorizontal?: DimensionValue
  handleClick?: () => void
  debounceTime?: number
  customStyle?: StyleProp<ViewStyle>
  customTextStyle?: StyleProp<TextStyle>
}

export default function CustomButton({ labelText = "button", type = "faded", width = "auto", handleClick = () => { }, adaptToTheme = false, disabled = false, allowMultipleClicks = false, isPending = false, debounceTime = 500, slim = false, squashed = false, bold = true, imgSrc, borderRadius = 1000, imgSize, paddingHorizontal, fontSize = 15, customStyle, customTextStyle, useMinWidth, children, freed }: PropsWithChildren<bProps>) {
  const fadedBg = useThemeColor({}, "fadedBackground")
  const darkenVib = useThemeColor({}, "darkenVibrant")
  const bg = useThemeColor({}, "background")
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
        return fadedBg

      case "less-prominent":
        return darkenVib

      case "themed":
        return bg

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
        backgroundColor: disabled ? mode === "light" ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault : backgroundColor,
        height: freed ? undefined : slim ? 43 : "auto",
        width: freed ? undefined : width,
        padding: freed ? undefined : squashed ? 6 : slim ? 10 : 15,
        paddingHorizontal: freed ? undefined : paddingHorizontal ? paddingHorizontal : squashed ? 13 : slim ? 10 : 15,
        borderRadius: borderRadius,
        minWidth: freed ? undefined : useMinWidth ? 100 : 0
      },
      customStyle
    ]}>
      {isPending &&
        <>
          <ActivityIndicator style={{
            width: fontSize,
            height: fontSize,
          }} color={getTextColor()} />
          <Spacer size="small" />
        </>
      }
      {!children && !isPending && imgSrc && <>
        <Image source={imgSrc} style={{
          width: imgSize ?? fontSize,
          height: imgSize ?? fontSize,
        }} />
        {!isPending && labelText && <Spacer size="small" />}
      </>}
      {!children && !isPending && labelText && <Text numberOfLines={1} ellipsizeMode="tail" style={[
        styles.text,
        {
          color: getTextColor(),
          fontSize: squashed ? 13 : slim ? 14 : fontSize ? fontSize : 15,
          fontWeight: bold ? 600 : "normal",
        },
        customTextStyle,
      ]}>{labelText}</Text>}
      {!isPending && children}
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