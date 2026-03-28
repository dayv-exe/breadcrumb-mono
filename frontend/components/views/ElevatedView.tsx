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
        shadowOpacity: flat ? 0 : mode === "light" ? 0.1 : 0.25,
        elevation: flat ? 0 : 4
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
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  }
})