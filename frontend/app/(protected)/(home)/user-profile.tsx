import { UserInitialDetails } from "@/api/userApi";
import BaseProfile from "@/components/profile/BaseProfile";
import { useLocalSearchParams } from "expo-router";

export default function UserProfileScreen() {
  const { userid, displayNickname } = useLocalSearchParams<UserInitialDetails>()
  return (
    <BaseProfile userId={userid} tempNickname={displayNickname} showBackButton />
  )
}