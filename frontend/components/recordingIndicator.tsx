import { usePulseAnimation } from "@/hooks/animations/usePulseAnimation";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import CustomLabel from "./CustomLabel";

export default function RecordingIndicator() {
  const pulseStyle = usePulseAnimation(true, { duration: 400 })

  return (
    <View style={{ position: "absolute", top: 10, width: "auto", flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.25)", paddingHorizontal: 7, borderRadius: 100 }}>
      <Animated.View style={[{
        width: 13,
        height: 13,
        borderRadius: "100%",
        backgroundColor: "red",
      }, pulseStyle]} />
      <CustomLabel labelText={`rec`} textAlign="center" width={"auto"} fontSize={15} />
    </View>
  )
}