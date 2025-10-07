import { PropsWithChildren } from "react";
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from "react-native";

type props = {
  customStyle?: StyleProp<ViewStyle>
}

export default function CustomScrollView({ children, customStyle }: PropsWithChildren<props>) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, customStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
})