import { Crumb } from "@/api/models/crumb";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PlayIcon, SquareIcon } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface props {
  crumb: Crumb
  userColor: string
}

export default function FloatingCrumb({ crumb, userColor }: props) {
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")
  const darkBgCol = useThemeColor({}, "darkBackground")
  const crumbIconCol = userColor

  const unlocked = false
  return (
    <TouchableOpacity disabled={!unlocked} style={[styles.item, {
      backgroundColor: darkBgCol,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    }]}>
      {!unlocked && <SquareIcon
        fill={crumb.locationSelectionManner === "gps" ? crumbIconCol : "transparent"}
        size={17}
        stroke={crumbIconCol}
        strokeWidth={3}
      />}

      {unlocked && <PlayIcon
        fill={crumb.locationSelectionManner === "gps" ? crumbIconCol : "transparent"}
        size={19}
        stroke={crumbIconCol}
        strokeWidth={3}
      />}

      <View style={{
        flexDirection: "row",
        flexGrow: 1,
        flexShrink: 1,
        alignItems: "center",
        justifyContent: "center",
      }}>
        {!unlocked && <>
          <Text
            style={{
              color: textCol,
              marginLeft: 10,
              // fontWeight: "600",
              fontSize: 14,
            }}
          >25 mi away</Text>
          <Text
            style={{
              color: textCol,
              fontWeight: "600",
              fontSize: 14,
              opacity: .65,
            }}
          > • </Text>
          <Text
            numberOfLines={1}
            style={{
              color: textCol,
              opacity: .65,
              flexGrow: 1,
              flexShrink: 1,
              fontSize: 12,
            }}
          >{crumb.formattedAddress}</Text>
        </>}

        {unlocked && <>
          <Text
            style={{
              color: textCol,
              marginLeft: 10,
              fontWeight: "600",
              fontSize: 16,
            }}
          >Tap to view</Text>

        </>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    // shadowColor: "#000",
    // shadowOpacity: .1,
    // shadowOffset: { height: 2, width: 2 },
    // shadowRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 15,
    paddingHorizontal: 15,

    height: 60,
  }
})