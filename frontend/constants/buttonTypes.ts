import { ColorValue } from "react-native"
import { Colors } from "./Colors"

export type buttonTypes = "prominent" | "faded" | "dark-faded" | "theme-faded" | "text" | "vibrant-text" | "less-vibrant-text" | "less-prominent" | "themed"

export function getBackgroundColor(type: buttonTypes, theme: any): ColorValue {

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

