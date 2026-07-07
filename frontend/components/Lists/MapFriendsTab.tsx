import { GetRecentCrumbedFriendIds } from "@/api/db/crumbsDb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/utils/authStore";
import { useFocusEffect } from "expo-router";
import { ListIcon } from "lucide-react-native";
import { PropsWithChildren, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Spacer from "../Spacer";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";

function TabButton({ children }: PropsWithChildren) {
  const bgCol = useThemeColor({}, "background")
  return (
    <TouchableOpacity style={{
      width: "auto",
      borderRadius: 15,
      backgroundColor: bgCol,
      padding: 10,
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
    <View pointerEvents="box-none" style={{
      position: "absolute",
      bottom: 15,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingRight: 10,
    }}>
      <ScrollView pointerEvents="box-none" horizontal showsHorizontalScrollIndicator={false} style={{
        width: "100%",
        paddingLeft: 10,
      }}>
        <CustomProfilePictureCircle size={55} />
        <Spacer size="small" />
        <CustomProfilePictureCircle size={55} />
      </ScrollView>
      <TabButton>
        <ListIcon stroke={textCol} strokeWidth={2} />
        <Spacer size="small" />
        <Text style={{
          color: textCol
        }}>List View</Text>
      </TabButton>
    </View>
  )
}