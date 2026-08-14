import { useShareCrumb } from "@/hooks/useShareCrumb";
import { useMediaStore } from "@/utils/mediaStore";
import { ChevronDownIcon, Trash2Icon } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomButton from "../buttons/CustomButton";
import CrumbView from "./CrumbView";

interface props {
  closeSheet: () => void
}

export default function PreviewAndShare({ closeSheet }: props) {
  const { mediaPreview, discardAllMedia } = useMediaStore(useShallow(s => ({
    mediaPreview: s.mediaPreview,
    discardAllMedia: s.discardAllMediaPreview,
  })))
  const insets = useSafeAreaInsets()
  const {
    address,
    isPending,
    locationOptions,
    recipients,
    selectedLocation,
    setRecipients,
    setSelectedLocation,
    setShowMap,
    showMap,
  } = useShareCrumb(() => { })
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
        <CustomLabel fontSize={18} bold labelText="Preview & Share" />
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

      <Spacer />

      <ScrollView
        style={{
          paddingBottom: 50
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
                  size={300}
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
          <CustomLabel labelText="Share with" fontSize={16} bold customStyle={{
            paddingHorizontal: 10,
          }} />
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >

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