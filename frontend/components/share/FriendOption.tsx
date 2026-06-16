import { useThemeColor } from "@/hooks/useThemeColor";
import { CheckIcon } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import CustomLabel from "../CustomLabel";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";

interface props {
  userid: string
  name: string
  nickname: string
  address?: string
  isSelected: boolean
  onChange: (s: boolean) => void
}
export default function FriendOption({ address, name, nickname, onChange, userid, isSelected }: props) {
  const fadedBg = useThemeColor({}, "fadedBackgroundElevated");
  const vibCol = useThemeColor({}, "darkenVibrant");

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 7,
      }}
      onPress={() => {
        onChange(!isSelected);
      }}
    >
      <CustomProfilePictureCircle nickname={nickname} size={40} customStyle={{ marginRight: 10 }} userId={userid} />
      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <CustomLabel
          allowTruncate
          customStyle={{ padding: 0, fontSize: 15, }}
          labelText={nickname}
          bold={isSelected}
          adaptToTheme
        />
        {((address && isSelected)) && (
          <CustomLabel
            customStyle={{ padding: 0, marginTop: 0, lineHeight: 14 }}
            fontSize={12}
            fade
            labelText={isSelected ? address : name}
            adaptToTheme
            allowTruncate
          />
        )}
      </View>
      <View
        style={{
          width: 21,
          height: 21,
          borderColor: isSelected ? vibCol : fadedBg,
          borderWidth: 2,
          borderRadius: 1000,
          marginRight: 5,
          backgroundColor: isSelected ? vibCol : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isSelected && (
          <CheckIcon size={14} stroke="#fff" strokeWidth={4} />
        )}
      </View>
    </TouchableOpacity>
  )
}