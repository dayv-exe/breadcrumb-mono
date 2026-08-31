import { Colors } from "@/constants/Colors";
import { useMediaStore } from "@/utils/mediaStore";
import { Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface props {
  recipientNames: string[]
  onShare: () => void
}

const BG = Colors.light.darkenVibrant


export default function ShareCrumbButton({ recipientNames, onShare }: props) {
  const insets = useSafeAreaInsets()
  const media = useMediaStore(s => s.media)

  const usePlural = media.length > 1

  return (
    <TouchableOpacity
      style={{
        marginHorizontal: insets.bottom,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        paddingHorizontal: 25,
        backgroundColor: BG,
        marginBottom: insets.bottom / 2,
        borderRadius: 1000,
        overflow: "hidden",
      }}
      onPress={onShare}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{`Leave Crumb${usePlural ? "s" : ""} Here`}</Text>
      {recipientNames.length > 1 && <Text style={{ color: "white", fontSize: 16 }}>{` [${recipientNames.length}]`}</Text>}
    </TouchableOpacity>
  )
}