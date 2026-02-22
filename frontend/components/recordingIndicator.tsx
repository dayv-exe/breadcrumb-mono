import { usePulseAnimation } from "@/hooks/animations/usePulseAnimation";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

type props = {
  customStyle?: ViewStyle
}

export default function RecordingIndicator({customStyle}: props) {
  const pulseStyle = usePulseAnimation(true, { duration: 400 })

  return (
    <View style={[{ position: "absolute", top: 10, width: "auto", flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.25)", paddingHorizontal: 7, borderRadius: 100 }, customStyle]}>
      <Animated.View style={[{
        width: 19,
        height: 19,
        borderRadius: "100%",
        backgroundColor: "red",
      }, pulseStyle]} />
      <Text style={style.text}>Rec</Text>
    </View>
  )
}

const style = StyleSheet.create({
  text: {
    fontSize: 18.5,
    padding: 5,
    color: "white",
  }
})