import { PropsWithChildren } from "react";
import { RefreshControl, ScrollView, StyleProp, StyleSheet, ViewStyle } from "react-native";

type props = {
  customStyle?: StyleProp<ViewStyle>
  onRefresh: () => void
  isRefreshing: boolean
}

export default function CustomRefreshableScrollView({ children, customStyle, onRefresh, isRefreshing }: PropsWithChildren<props>) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, customStyle]} keyboardShouldPersistTaps="handled" refreshControl={
      <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
    }>
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