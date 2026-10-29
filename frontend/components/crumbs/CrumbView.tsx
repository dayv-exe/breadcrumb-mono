import { deleteDraftMedia } from "@/api/deleteDraftMedia";
import { crumbMedia } from "@/api/models/crumbMedia";
import { MediaData } from "@/constants/media";
import { Colors } from "@/constants/theme";
import { useMediaStore } from "@/utils/mediaStore";
import { Trash2Icon } from "lucide-react-native";
import { useState } from "react";
import { Image, StyleProp, StyleSheet, TextInput, useWindowDimensions, View, ViewStyle } from "react-native";
import { useShallow } from "zustand/shallow";
import CustomButton from "../buttons/CustomButton";

interface baseProps {
  size: number
  maxSize?: number
  style?: StyleProp<ViewStyle>
}

type PreviewType = baseProps & {
  type: "preview"
  mediaData: MediaData
  onCaptionFocus?: () => void
}

type ReadonlyType = baseProps & {
  type: "readonly"
  media: crumbMedia
}

type props = PreviewType | ReadonlyType

export default function CrumbView(props: props) {
  const screenWidth = useWindowDimensions().width

  const c = props.type === "preview" ? props.mediaData.caption : props.media.caption
  const [caption, setCaption] = useState(c)
  const size = Math.min(props.size, props.maxSize ?? screenWidth * .85)
  const borderThickness = size / 20
  const borderRadius = borderThickness / 15

  const {
    removeCrumb,
    updateCaption,
  } = useMediaStore(useShallow(s => ({
    updateCaption: s.updateMediaCaption,
    removeCrumb: s.remove,
  })))

  const handleRemoveCrumb = () => {
    if (props.type === "readonly") return
    const mediaData = props.mediaData
    let keys = []
    if (mediaData.uploadState.storageKey) keys.push(mediaData.uploadState.storageKey)
    if (mediaData.uploadState.thumbnailStorageKey) keys.push(mediaData.uploadState.thumbnailStorageKey)

    deleteDraftMedia(keys)
    removeCrumb(mediaData.id)
  }

  const getImageUri = () => {
    if (props.type === "preview") {
      const mediaData = props.mediaData
      return mediaData.type === "video" ? mediaData.thumbnail : mediaData.localUri
    }

    const media = props.media
    return media.type === "video" ? media.thumbnail : media.media
  }

  return (
    <View
      style={[props.style, {
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
          borderColor: "#FFF",
          borderTopEndRadius: borderRadius,
          borderTopStartRadius: borderRadius,
        }}
      >
        <Image
          source={{ uri: getImageUri() }}
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
        {props.type === "preview" && <CustomButton
          customStyle={{
            position: "absolute",
            right: 5,
            top: 5,
            padding: 5,
            backgroundColor: "rgba(0, 0, 0, .175)"
          }}
          freed
          handleClick={handleRemoveCrumb}
        >
          <Trash2Icon stroke="white" strokeWidth={2.5} size={20} />
        </CustomButton>}
      </View>
      <View
        style={{
          width: size,
          backgroundColor: "#FFF",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          borderBottomEndRadius: borderRadius,
          borderBottomStartRadius: borderRadius,
        }}
      >
        <TextInput
          maxLength={50}
          readOnly={props.type === "readonly"}
          value={caption}
          onFocus={props.type === "preview" ? props.onCaptionFocus : undefined}
          onChangeText={e => setCaption(e)}
          onEndEditing={() => {
            if (props.type === "readonly") return
            const mediaData = props.mediaData
            updateCaption(mediaData.id, caption ?? "")
          }}
          placeholder="Add caption..."
          placeholderTextColor={Colors.light.text + "55"}
          style={{
            marginTop: borderThickness / 2,
            textAlignVertical: "top",
            textAlign: "left",
            paddingHorizontal: borderThickness,
            height: size / 4.75,
            fontSize: size / 20,
            color: Colors.light.text,
            width: "100%",
          }}
          multiline
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
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