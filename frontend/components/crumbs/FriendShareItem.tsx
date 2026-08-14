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
          width: 70,
          height: 115,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <CustomProfilePictureCircle
          useUserColor
          forceMode="light"
          size={63}
          customStyle={{
            marginBottom: 4,
            borderWidth: 1,
            outlineWidth: 5,
            outlineColor: isSelected ? Colors.light.vibrantBackground : "transparent"
          }}
        />

        {isSelected && <View
          style={{
            backgroundColor: Colors.light.vibrantBackground,
            padding: 5,
            borderRadius: "100%",
            position: "absolute",
            bottom: 50,
            right: -3,
            // borderWidth: 2,
            // borderColor: darkBgCol,
            outlineWidth: 3,
            outlineColor: darkBgCol
          }}
        >
          <CheckIcon stroke="white" strokeWidth={3.5} size={13} />
        </View>}

        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 14
          }}
          numberOfLines={2}
        >{name ?? "Test"}</Text>
      </View>
    </TouchableOpacity>
  )
}