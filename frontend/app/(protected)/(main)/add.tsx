import CustomCamera from "@/components/posts/customCamera";
import { useIsFocused } from "@react-navigation/native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddScreen() {
  const isFocused = useIsFocused()
  const insets = useSafeAreaInsets()

  return (
    <View style={{flex: 1, backgroundColor: "black", paddingTop: insets.top}}>
      {isFocused && <CustomCamera />}
    </View>
  )
  
}