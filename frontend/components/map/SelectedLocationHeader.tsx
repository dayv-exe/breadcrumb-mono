import { useThemeColor } from "@/hooks/useThemeColor";
import { convertToPreferredDistance } from "@/utils/helpers";
import { Camera, View, X } from "lucide-react-native";
import { StyleSheet } from "react-native";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  name: string
  type: string
  distance: number
  address: string
  iconEmoji: string
  showCamera: () => void
  clearSelection: () => void
}
export default function SelectedLocationHeader({ address, distance, name, type, iconEmoji, showCamera, clearSelection }: props) {
  const textCol = useThemeColor({}, "text")

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <CustomLabel
          labelText={
            iconEmoji
          }
          fontSize={42}
          adaptToTheme customStyle={{ padding: 0, width: "auto" }} />
      </View>
      <View style={styles.details}>
        <CustomLabel adaptToTheme labelText={name} bold fontSize={17} customStyle={{ padding: 0, marginBottom: 2 }} />

        <CustomLabel adaptToTheme labelText={type} customStyle={{ padding: 0 }} width={"auto"} fontSize={14} />
        <CustomLabel adaptToTheme labelText={`${convertToPreferredDistance(distance)} ${address ? "• " + address : ""}`} allowTruncate fade customStyle={{ padding: 0 }} fontSize={13} />
      </View>
      <View style={styles.actions}>
        <CustomFloatingSquare type="theme-faded" isFlat customStyle={{ borderRadius: 1000, height: 35, width: 35 }}>
          <Camera size={17} stroke={textCol} strokeWidth={3} />
        </CustomFloatingSquare>
        <Spacer size="small" />
        <CustomFloatingSquare type="theme-faded" isFlat customStyle={{ borderRadius: 1000, height: 35, width: 35 }} handleClick={clearSelection}>
          <X size={17} stroke={textCol} strokeWidth={3} />
        </CustomFloatingSquare>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexDirection: "row"
  },
  icon: {
    flexGrow: 1,
    flexShrink: 1,
  },
  details: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start"
  },
  actions: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
})