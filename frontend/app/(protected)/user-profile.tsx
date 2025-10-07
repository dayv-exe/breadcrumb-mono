import BaseProfile from "@/components/profile/BaseProfile";
import { useLocalSearchParams } from "expo-router";

const icons = {
  options: {
    light: require("../../assets/images/icons/options_sel_light.png"),
    dark: require("../../assets/images/icons/options_sel_dark.png")
  },
  findFriends: {
    light: require("../../assets/images/icons/searchfriends_sel_light.png"),
    dark: require("../../assets/images/icons/searchfriends_sel_dark.png")
  },
  back: {
    light: require("../../assets/images/icons/back_sel_light.png"),
    dark: require("../../assets/images/icons/back_sel_dark.png")
  },
  message: {
    light: require("../../assets/images/icons/messages_sel_light.png"),
    dark: require("../../assets/images/icons/messages_sel_dark.png")
  },
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function UserProfileScreen() {
  const { userId, tempNickname } = useLocalSearchParams<{ userId: string, tempNickname?:string }>()
  return (
    <BaseProfile userId={userId} tempNickname={tempNickname} showBackButton />
  )
}