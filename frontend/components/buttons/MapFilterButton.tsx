import { useThemeColor } from "@/hooks/useThemeColor";
import { PropsWithChildren } from "react";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";

interface props {
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

export default function MapFilterButton({ onPress, style, children }: PropsWithChildren<props>) {
  const bgCol = useThemeColor({}, "background")

  return (
    <TouchableOpacity onPress={onPress} style={[{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bgCol,
      borderRadius: 1000,
      paddingHorizontal: 10,
      height: 27,
    }, style]}>
      {children}
    </TouchableOpacity>
  )
}