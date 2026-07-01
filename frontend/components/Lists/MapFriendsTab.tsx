import { useThemeColor } from "@/hooks/useThemeColor";
import { ListIcon, UserPlus } from "lucide-react-native";
import { PropsWithChildren } from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import Spacer from "../Spacer";

function TabButton({ children }: PropsWithChildren) {
  const bgCol = useThemeColor({}, "background")
  return (
    <TouchableOpacity style={{
      borderRadius: 1000,
      backgroundColor: bgCol,
      padding: 17,
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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{
      width: "100%",
      position: "absolute",
      bottom: 5,
      paddingHorizontal: 15,
      paddingVertical: 10
    }}>
      <TabButton>
        <ListIcon size={20} stroke={textCol} strokeWidth={3} />
        <Spacer size="small" />
        <Text
          style={{
            fontWeight: "700",
            color: textCol
          }}
        >List view</Text>
      </TabButton>
      <Spacer size="small" />
      <TabButton>
        <UserPlus size={20} stroke={textCol} strokeWidth={3} />
      </TabButton>
    </ScrollView>
  )
}