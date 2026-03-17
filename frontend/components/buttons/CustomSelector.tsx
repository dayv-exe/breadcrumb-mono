import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState } from "react";
import { AnimatableNumericValue, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import CustomButton from "./CustomButton";

type props = {
  options: string[]
  borderRadius?: string | AnimatableNumericValue
  defaultSelectedIndex?: number
  onSelect: (s: string) => void
  startPadding?: number,
  style?: StyleProp<ViewStyle>
}

const icons = {
  check: {
    light: require("../../assets/images/icons/check_unsel_light.png"),
    dark: require("../../assets/images/icons/check_unsel_dark.png")
  },
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function CustomSelector({ options, borderRadius = 15, onSelect, defaultSelectedIndex = 0, startPadding=15, style }: props) {
  const [sel, setSel] = useState(options[defaultSelectedIndex])
  const textCol = useThemeColor({}, "text")
  const vibCol = useThemeColor({}, "darkenVibrant")
  const mode = useColorScheme()
  function handleSel(s: string) {
    setSel(s)
    onSelect(s)
  }

  return (
    <ScrollView horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      {options.map((option, index) => (
        <View key={option} style={[{ flexDirection: "row", paddingLeft: index === 0 ? startPadding : 0, }, style]}>
          <CustomButton imgSrc={
            sel === option && false ?
              getIconImage("check", mode === "light") : ""
          } borderRadius={borderRadius} adaptToTheme squashed type={sel === option ? "theme-faded" : "text"} customStyle={{
            backgroundColor: sel === option ? vibCol + "44" : "transparent",
            paddingHorizontal: sel === option ? 15 : 7
          }} labelText={option} handleClick={() => handleSel(option)} customTextStyle={{ opacity: sel === option ? .75 : .5, fontWeight: sel === option ? "bold" : "regular" }} />
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  }
})