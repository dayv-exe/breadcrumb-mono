import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface props {
  flat?: boolean
  style?: StyleProp<ViewStyle>
}

export default function ElevatedView({ flat, style, children }: PropsWithChildren<props>) {
  const bgCol = useThemeColor({}, "lightBackground")
  const mode = useColorScheme()
  return (
    <View style={[
      styles.container, {
        backgroundColor: bgCol,
      },
      style
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 3,
    borderRadius: 20,
    zIndex: 1,
  }
})