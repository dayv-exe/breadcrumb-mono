import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type props = {
  size?: number
  imgUrl?: string
  nickname: string
  handleClick?: (src: string,) => void
}

export default function CustomProfilePictureCircle({ size = 100, handleClick, imgUrl, nickname }: props) {
  const mode = useColorScheme()

  const fgColLight = "#555"
  const fgColDark = "#fff"

  const bgCol = useThemeColor({}, "fadedBackground")

  const initials = nickname.length > 1 ? nickname.substring(0, 2) : "00"

  return (
    <TouchableOpacity style={{
      backgroundColor: bgCol,
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "100%",
    }} onPress={() => {
      if (handleClick) {
        handleClick(imgUrl ?? "")
      }
    }}>
      <Text style={{
        fontSize: size * .35,
        fontWeight: "300",
        color: mode === "light" ? fgColLight : fgColDark
      }}>{initials.toUpperCase()}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: "100%"
  }
})