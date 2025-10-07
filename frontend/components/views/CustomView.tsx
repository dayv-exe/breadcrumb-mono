import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PropsWithChildren } from "react";
import { DimensionValue, Keyboard, StyleSheet, View } from "react-native";

type cvProps = {
  backgroundColor?: string
  verticalAlign?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined
  horizontalPadding?: DimensionValue
  adaptToTheme?: boolean
}

export default function CustomView({ children, backgroundColor = "#FFF", verticalAlign = "flex-start", horizontalPadding = 40, adaptToTheme = false }: PropsWithChildren<cvProps>) {
  const theme = useThemeColor

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: adaptToTheme ? theme({}, "background") : backgroundColor,
        justifyContent: verticalAlign,
        paddingHorizontal: horizontalPadding
      }
    ]} onTouchStart={Keyboard.dismiss}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.vibrantBackground,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%"
  },
})