import { useGetProfilePicture } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AnimatableNumericValue, Image, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type props = {
  size?: number
  nickname?: string | null | undefined
  userId?: string | null | undefined
  customStyle?: StyleProp<ViewStyle>
  customTextStyle?: StyleProp<TextStyle>
  borderRadius?: string | AnimatableNumericValue | undefined
}

export default function CrumbItemImage({ size = 100, nickname, userId, customStyle, customTextStyle, borderRadius }: props) {
  const { data, isLoading } = useGetProfilePicture(userId ?? "");
  const mode = useColorScheme();

  const fgColLight = "#555";
  const fgColDark = "#fff";
  const fadedBgCol = useThemeColor({}, "fadedBackground");
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")

  const url = (data?.message && !data.error) ? data?.message?.thumbnail : null;

  nickname = nickname ?? "";
  const parts = nickname.split(/[._]/);
  const initials = parts[0].substring(0, 1) + (parts.length > 1 ? parts[1].substring(0, 1) : "");

  return (
    <View style={{
      backgroundColor: bgCol,
      padding: 4,
      paddingBottom: 10,
      borderRadius: 5
    }}>
      <View
        style={[{
          backgroundColor: fadedBgCol,
          width: size,
          height: size - 4,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 0,
          overflow: "hidden",
        }, customStyle]}
      >
        {url ? (
          <Image
            source={{ uri: url }}
            style={{ width: size, height: size }}
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
      </View>
    </View>
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