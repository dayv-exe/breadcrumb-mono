import { useMediaStore } from "@/utils/mediaStore";
import { ChevronDownIcon, Trash2Icon } from "lucide-react-native";
import { DimensionValue, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomButton from "../buttons/CustomButton";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import CrumbView from "./CrumbView";

interface props {
  address: string
  closeSheet: () => void
}

const NUM_OF_COLUMNS = 3
function FriendShareItem({ name }: { name?: string }) {
  const WIDTH: DimensionValue = `${100 / NUM_OF_COLUMNS}%`

  return (
    <View
      style={{
        width: WIDTH,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 80,
          height: 125,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <CustomProfilePictureCircle
          size={70}
          customStyle={{
            marginBottom: 7,
          }}
        />
        <Text
          style={{
            color: "white",
            textAlign: "center",
          }}
          numberOfLines={2}
        >{name ?? "Test"}</Text>
      </View>
    </View>
  )
}

export default function PreviewAndShare({ address, closeSheet }: props) {
  const { mediaPreview, discardAllMedia } = useMediaStore(useShallow(s => ({
    mediaPreview: s.mediaPreview,
    discardAllMedia: s.discardAllMediaPreview,
  })))
  const insets = useSafeAreaInsets()
  function handleDiscardAllMedia() {
    closeSheet()
    discardAllMedia()
  }

  return (
    <View
      style={[styles.container, {
        paddingTop: insets.top,
      }]}
    >
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CustomButton
          type="text"
          freed
          customStyle={{
            position: "absolute",
            left: 0,
            padding: 15,
          }}
          handleClick={closeSheet}
        >
          <ChevronDownIcon stroke={"white"} strokeWidth={3.5} size={25} />
        </CustomButton>
        <CustomLabel fontSize={18} bold labelText="Preview" />
        <CustomButton
          type="text"
          freed
          customStyle={{
            position: "absolute",
            right: 0,
            padding: 15,
          }}
          handleClick={handleDiscardAllMedia}
        >
          <Trash2Icon stroke={"red"} strokeWidth={2.5} size={20} />
          <Text
            style={{
              color: "red",
              fontWeight: "800"
            }}
          > ({mediaPreview.length})</Text>
        </CustomButton>
      </View>

      <ScrollView
        style={{
          paddingTop: 25,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            paddingHorizontal: 15,
          }}
        >
          {
            mediaPreview.map(media => {
              return (
                <CrumbView
                  key={media.id}
                  imageUri={media.uri}
                  style={{
                    marginRight: 10,
                  }}
                />
              )
            })
          }
        </ScrollView>

        <Spacer size="big" />
        <View
          style={{
            paddingHorizontal: 15,
          }}
        >
          <CustomLabel labelText="Share with" bold fontSize={16} />
          <Spacer size="small" />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <FriendShareItem name="(Me) David" />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {

  },
  header: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {

  },
  backButton: {
    position: "absolute",
    left: 0,
  }
})