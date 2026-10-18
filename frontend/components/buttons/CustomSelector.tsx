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

export default function CustomSelector({ options, borderRadius = 15, onSelect, defaultSelectedIndex = 0, startPadding = 15, style }: props) {
  const [sel, setSel] = useState(options[defaultSelectedIndex])
  const textCol = useThemeColor({}, "text")
  const vibCol = useThemeColor({}, "darkenVibrant")
  const mode = useColorScheme()
  const bgCol = useThemeColor({}, "background")
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
          <CustomButton freed borderRadius={borderRadius} adaptToTheme customStyle={{
            backgroundColor: sel === option ? vibCol : bgCol,
            paddingVertical: 3,
            paddingHorizontal: 7,
          }} labelText={option} handleClick={() => handleSel(option)} customTextStyle={{
            fontWeight: sel === option ? "bold" : "regular",
            color: sel === option ? "white" : textCol
          }} />
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