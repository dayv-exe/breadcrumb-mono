import { Colors } from "@/constants/theme";
import { Image, StyleProp, StyleSheet, TextInput, View, ViewStyle } from "react-native";

interface props {
  imageUri: string
  size?: number
  style?: StyleProp<ViewStyle>
}

export default function CrumbView({ imageUri, size = 320, style }: props) {
  const borderThickness = size / 25

  return (
    <View
      style={style}
    >
      <View
        style={{
          width: size,
          height: size,
          borderWidth: borderThickness,
          borderBottomWidth: 0,
          borderColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: imageUri }}
          style={{
            width: "100%",
            height: "100%",
            borderWidth: .5,
            borderColor: "grey"
          }}
          resizeMode="cover"
        />
      </View>
      <View
        style={{
          width: size,
          backgroundColor: "white"
        }}
      >
        <TextInput
          placeholder="Add caption..."
          placeholderTextColor={Colors.light.text + "55"}
          style={{
            marginTop: borderThickness / 2,
            textAlignVertical: "top",
            textAlign: "left",
            paddingHorizontal: borderThickness,
            height: size / 5,
            fontSize: size / 20,
            color: Colors.light.text
          }}
          multiline
          submitBehavior="blurAndSubmit"
          scrollEnabled={false}
          numberOfLines={2}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 5,
    borderColor: "white"
  }
})