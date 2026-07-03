import { GetRecentCrumbedFriendIds } from "@/api/db/crumbsDb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useFocusEffect } from "expo-router";
import { ListIcon, UserPlus } from "lucide-react-native";
import { PropsWithChildren, useState } from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import Spacer from "../Spacer";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";

function TabButton({ children }: PropsWithChildren) {
  const bgCol = useThemeColor({}, "background")
  return (
    <TouchableOpacity style={{
      borderRadius: 1000,
      backgroundColor: bgCol,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      shadowColor: "black",
      shadowOffset: { height: 3, width: 3 },
      shadowOpacity: .25,
      shadowRadius: 5,
      elevation: 5
    }}>
      {children}
    </TouchableOpacity>
  )
}

export default function MapFriendTab() {
  const textCol = useThemeColor({}, "text")
  const bgCol = useThemeColor({}, "background")
  const darkBgCol = useThemeColor({}, "darkBackground")
  const userid = useAuthStore(s => s.userId)
  const [recents, setRecents] = useState<Set<string>>()

  useFocusEffect(() => {
    const getRecents = async () => {
      const r = await GetRecentCrumbedFriendIds(userid)
      setRecents(r)
    }
    getRecents()
  })

  return (
    <ScrollView horizontal pointerEvents="box-none" showsHorizontalScrollIndicator={false} style={{
      width: "100%",
      position: "absolute",
      bottom: 5,
      paddingHorizontal: 15,
      paddingVertical: 10
    }}>
      <TabButton>
        <ListIcon size={18} stroke={textCol} strokeWidth={2} />
        <Spacer size="small" />
        <Text
          style={{
            color: textCol
          }}
        >List view</Text>
      </TabButton>
      <Spacer size="small" />
      {
        recents && [...recents].map((id) => (
          <CustomProfilePictureCircle useUserColor backgroundColor={bgCol} key={id} userId={id} size={47} customStyle={{
            padding: 0,
            margin: 0,
            borderColor: darkBgCol,
            borderWidth: 3,
            marginRight: 12,

            elevation: 5,
            shadowColor: "black",
            shadowOffset: { height: 2, width: 2 },
            shadowOpacity: 1,
            shadowRadius: 5,
          }} handleClick={() => {
            console.log("")
          }} />
        ))
      }
      {recents?.size === 0 && <TabButton>
        <UserPlus size={18} stroke={textCol} strokeWidth={2} style={{
        }} />
      </TabButton>}
    </ScrollView>
  )
}