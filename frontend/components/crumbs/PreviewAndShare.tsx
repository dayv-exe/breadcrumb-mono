import { extractBackendMsg } from "@/api/models/apiResponse";
import { ShowToast } from "@/constants/appConstants";
import { useShareCrumb } from "@/hooks/useShareCrumb";
import { useMediaStore } from "@/utils/mediaStore";
import { ChevronDownIcon, MapPinIcon, Trash2Icon } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomButton from "../buttons/CustomButton";
import ShareCrumbButton from "../buttons/ShareCrumbButton";
import { useModal } from "../modals/ModalContext";
import ShareCrumbFriendList from "../views/ShareCrumbFriendList";
import CrumbView from "./CrumbView";

interface props {
  closeSheet: () => void
}

export default function PreviewAndShare({ closeSheet }: props) {
  const { mediaPreview, discardAllMedia } = useMediaStore(useShallow(s => ({
    mediaPreview: s.media,
    discardAllMedia: s.clear,
  })))
  const insets = useSafeAreaInsets()

  const { hideModal, showModal } = useModal()

  const {
    isPending,
    share,
    address,
    recipients,
    setRecipients,
  } = useShareCrumb({
    onError(error) {
      showModal({
        content: (
          <>
            <CustomLabel adaptToTheme labelText={extractBackendMsg(error)} />
            <CustomButton labelText="ok" handleClick={hideModal} />
          </>
        )
      })
    },
    onSuccess: () => {
      ShowToast("Done")
    }
  })
  function handleDiscardAllMedia() {
    discardAllMedia()
  }

  useEffect(() => {
    if (mediaPreview.length < 1) closeSheet()
  }, [mediaPreview])

  const scrollRef = useRef<ScrollView>(null)
  const layouts = useRef<Record<string, { x: number; width: number }>>({})
  const { width: screenWidth } = useWindowDimensions()

  const centerOnCrumb = useCallback((id: string) => {
    const layout = layouts.current[id]
    if (!layout) return
    const x = layout.x + layout.width / 2 - screenWidth / 2
    scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: true })
  }, [screenWidth])

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
        {<CustomButton
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
        </CustomButton>}
      </View>
      <Spacer />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
        }}
      >
        <Spacer />
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="never"
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
                  mediaData={media}
                  style={{
                    marginRight: 10,
                  }}
                  onCaptionFocus={() => centerOnCrumb(media.id)}
                />
              )
            })
          }
        </ScrollView>

        <Spacer size="big" />

        <ShareCrumbFriendList
          recipients={recipients}
          setRecipients={setRecipients}
        />
      </ScrollView>
      {recipients.length > 0 && <View
        style={{
        }}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: "row",
            marginHorizontal: insets.bottom + 10,
            marginTop: 7,
          }}
        >
          <MapPinIcon stroke="white" strokeWidth={2.5} size={14} />
          <Spacer size="tiny" />
          <CustomLabel fontSize={13} labelText={address?.split(",")[0] ?? "Current location"} customStyle={{
          }} />
        </View>
        <Spacer />
        <ShareCrumbButton
          disabled={isPending}
          onShare={share}
          recipientNames={recipients.map(r => r.name)}
        />
      </View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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