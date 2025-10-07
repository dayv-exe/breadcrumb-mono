import { DimensionValue } from "react-native"

export type vAlign = "center" | "top" | "bottom"

export type cvProps = {
  useVibrantBg?: boolean
  verticalAlign?: vAlign
  width?: DimensionValue
  padding?: DimensionValue
}