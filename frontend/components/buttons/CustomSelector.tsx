import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useState } from "react";
import { AnimatableNumericValue, ScrollView, StyleSheet, View } from "react-native";
import Spacer from "../Spacer";
import CustomButton from "./CustomButton";

type props = {
  options: string[]
  borderRadius?: string | AnimatableNumericValue
  defaultSelectedIndex?: number
  onSelect: (s: string) => void
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

export default function CustomSelector({ options, borderRadius = 15, onSelect, defaultSelectedIndex = 0 }: props) {
  const [sel, setSel] = useState(options[defaultSelectedIndex])
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
      {options.map(option => (
        <View key={option} style={{ flexDirection: "row" }}>
          <Spacer size="small" />
          <CustomButton borderRadius={borderRadius} imgSize={13} imgSrc={sel === option ? getIconImage("check", mode === "light") : ""} adaptToTheme squashed type="theme-faded" labelText={option} handleClick={() => handleSel(option)} />
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  }
})