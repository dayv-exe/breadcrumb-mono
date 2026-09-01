import { MediaData } from "@/constants/media";
import { Colors } from "@/constants/theme";
import { useMediaStore } from "@/utils/mediaStore";
import { Trash2Icon } from "lucide-react-native";
import { useState } from "react";
import { Image, StyleProp, StyleSheet, TextInput, View, ViewStyle } from "react-native";
import { useShallow } from "zustand/shallow";
import CustomButton from "../buttons/CustomButton";

interface props {
  mediaData: MediaData
  size?: number
  style?: StyleProp<ViewStyle>
  onCaptionFocus?: () => void
}

export default function CrumbView({ mediaData, size = 320, style, onCaptionFocus }: props) {
  const [caption, setCaption] = useState(mediaData.caption)
  const borderThickness = size / 25

  const {
    removeCrumb,
    updateCaption,
  } = useMediaStore(useShallow(s => ({
    updateCaption: s.updateMediaCaption,
    removeCrumb: s.remove,
  })))

  return (
    <View
      style={[style, {
        shadowColor: "rgba(0, 0, 0, 1)",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
      }]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderWidth: borderThickness,
          borderBottomWidth: 0,
          borderColor: "#FFFFFF",
        }}
      >
        <Image
          source={{ uri: mediaData.type === "video" ? mediaData.thumbnailUri : mediaData.localUri }}
          style={{
            width: "100%",
            height: "100%",
            borderWidth: .5,
            borderColor: "grey"
          }}
          resizeMode="cover"
        />
        <CustomButton
          customStyle={{
            position: "absolute",
            right: 5,
            top: 5,
            padding: 5,
            backgroundColor: "rgba(0, 0, 0, .175)"
          }}
          freed
          handleClick={() => removeCrumb(mediaData.id)}
        >
          <Trash2Icon stroke="white" strokeWidth={2.5} size={20} />
        </CustomButton>
      </View>
      <View
        style={{
          width: size,
          backgroundColor: "white",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <TextInput
          maxLength={50}
          value={caption}
          onFocus={onCaptionFocus}
          onChangeText={e => setCaption(e)}
          onEndEditing={() => {
            updateCaption(mediaData.id, caption ?? "")
          }}
          placeholder="Add caption..."
          placeholderTextColor={Colors.light.text + "55"}
          style={{
            marginTop: borderThickness / 2,
            textAlignVertical: "top",
            textAlign: "left",
            paddingHorizontal: borderThickness,
            height: size / 5,
            fontSize: size / 20,
            color: Colors.light.text,
            width: "100%",
          }}
          multiline
          submitBehavior="blurAndSubmit"
          scrollEnabled={false}
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