import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface props {
  style?: StyleProp<ViewStyle>
}

export default function ElevatedView({ style, children }: PropsWithChildren<props>) {
  const bgCol = useThemeColor({}, "lightBackground")
  const mode = useColorScheme()
  return (
    <View style={[
      styles.container, {
        backgroundColor: bgCol,
        shadowOpacity: mode === "light" ? 0.075 : 0.25,
      },
      style
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 3,
    elevation: 4,
    zIndex: 1,
  }
})