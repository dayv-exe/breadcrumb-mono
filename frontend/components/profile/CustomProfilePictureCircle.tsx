import { useColorScheme } from "@/hooks/useColorScheme.web";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type props = {
  size?: number
  imgUrl?: string
  nickname?: string | null | undefined
  handleClick?: (src: string,) => void
}

export default function CustomProfilePictureCircle({ size = 100, handleClick, imgUrl, nickname }: props) {
  const mode = useColorScheme()

  const fgColLight = "#555"
  const fgColDark = "#fff"

  const bgCol = "gray"

  nickname = nickname ?? ""
  const parts = nickname.split(/[._]/);
  const initials = parts[0].substring(0, 1) + (parts.length > 1 ? parts[1].substring(0, 1) : "")

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