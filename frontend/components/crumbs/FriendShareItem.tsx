import { Colors } from "@/constants/Colors"
import { CheckIcon } from "lucide-react-native"
import { DimensionValue, Text, TouchableOpacity, View } from "react-native"
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle"

const NUM_OF_COLUMNS = 3

interface props {
  userid: string
  name: string
  isSelected: boolean
  onChange: (state: boolean) => void
}

export function FriendShareItem({ name, onChange, userid, isSelected }: props) {
  const WIDTH: DimensionValue = `${100 / NUM_OF_COLUMNS}%`
  const darkBgCol = Colors.dark.background

  return (
    <TouchableOpacity
      style={{
        width: WIDTH,
        alignItems: "center",
      }}
      onPress={() => {
        onChange(!isSelected)
      }}
    >
      <View
        style={{
          width: 75,
          height: 115,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <CustomProfilePictureCircle
          userId={userid}
          forceMode="light"
          size={63}
          customStyle={{
            marginBottom: 5,
            borderWidth: 1,
          }}
        />

        {isSelected && <View
          style={{
            backgroundColor: Colors.dark.darkenVibrant,
            width: 23,
            height: 23,
            borderRadius: "100%",
            position: "absolute",
            bottom: 50,
            right: 0,
            outlineWidth: 3,
            outlineColor: darkBgCol,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckIcon stroke="white" strokeWidth={4} size={16} />
        </View>}

        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 13
          }}
          numberOfLines={2}
        >{name ?? "Test"}</Text>
      </View>
    </TouchableOpacity>
  )
}