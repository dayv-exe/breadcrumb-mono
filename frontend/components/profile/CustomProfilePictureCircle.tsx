import { useGetProfilePicture } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Image, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";

type props = {
  size?: number
  nickname?: string | null | undefined
  userId?: string | null | undefined
  customStyle?: StyleProp<ViewStyle>
  customTextStyle?: StyleProp<TextStyle>
  handleClick?: (src: string,) => void
}

export default function CustomProfilePictureCircle({ size = 100, handleClick, nickname, userId, customStyle, customTextStyle }: props) {
  const { data, isLoading } = useGetProfilePicture(userId ?? "");
  const mode = useColorScheme();

  const fgColLight = "#555";
  const fgColDark = "#fff";
  const bgCol = useThemeColor({}, "fadedBackground");

  const url = (data?.message && !data.error) ? data?.message?.thumbnail : null;

  nickname = nickname ?? "";
  const parts = nickname.split(/[._]/);
  const initials = parts[0].substring(0, 1) + (parts.length > 1 ? parts[1].substring(0, 1) : "");

  return (
    <TouchableOpacity
      style={[{
        backgroundColor: bgCol,
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: size / 2,
        overflow: "hidden",
        borderColor: "rgba(0, 0, 0, .1)",
        borderWidth: 1
      }, customStyle]}
      onPress={() => handleClick?.(url ?? "")}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[{
          fontSize: size * 0.35,
          fontWeight: "300",
          color: mode === "light" ? fgColLight : fgColDark,
        }, customTextStyle]}>
          {initials.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
  }
})