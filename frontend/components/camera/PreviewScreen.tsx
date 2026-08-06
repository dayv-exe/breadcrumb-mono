import { useMediaStore } from "@/utils/mediaStore";
import { StyleSheet, View } from "react-native";
import { useShallow } from "zustand/shallow";

export default function PreviewScreen() {
  const {
    media,
  } = useMediaStore(useShallow(s => ({
    media: s.mediaPreview,
  })))

  return (
    <View
    style={[styles.container, {

    }]}
    >

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  }
})