import { useThemeColor } from "@/hooks/useThemeColor";
import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface props {
  style?: StyleProp<ViewStyle>
}

export default function SunkenView({ children, style }: PropsWithChildren<props>) {
  const darkBgCol = useThemeColor({}, "darkBackground")
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: darkBgCol
      },
      style
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})