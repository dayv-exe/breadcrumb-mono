import BaseProfile from "@/components/profile/BaseProfile";
import { GetId } from "@/constants/userAccountDetails";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

export default function ProfileScreen() {
  const [userId, setUserId] = useState<string>("")

  async function getAndSetMyId() {
    const id = await GetId()
    setUserId(id)
  }

  useEffect(() => {
    getAndSetMyId()
  }, [])
  return (
    <>
      {userId && <BaseProfile userId={userId} />}
      {!userId && <ActivityIndicator />}
    </>
  )
}