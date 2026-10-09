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
  const borderThickness = size / 20
  const borderRadius = borderThickness / 4.5

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
          // borderTopWidth: borderThickness * 2,
          borderBottomWidth: borderThickness / 1.5,
          borderColor: "#FFF",
          borderTopEndRadius: borderRadius,
          borderTopStartRadius: borderRadius,
        }}
      >
        <Image
          source={{ uri: mediaData.type === "video" ? mediaData.thumbnail : mediaData.localUri }}
          style={{
            width: "100%",
            height: "100%",

          }}
          resizeMode="cover"
        />
        {/* Inner shadow overlay */}
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFill,
            boxShadow: [

              { inset: true, offsetX: 0, offsetY: 0, blurRadius: borderThickness, color: "rgba(0,0,0, .25)" },
            ],
          }}
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
          backgroundColor: "#F6F6F6",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          borderBottomEndRadius: borderRadius,
          borderBottomStartRadius: borderRadius,
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