import { UserDetails } from "@/api/models/userDetails";
import { Colors } from "@/constants/Colors";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useShareCrumb } from "@/hooks/useShareCrumb";
import { useMediaStore } from "@/utils/mediaStore";
import { ChevronDownIcon, MapPinIcon, Trash2Icon } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomButton from "../buttons/CustomButton";
import CrumbView from "./CrumbView";
import { FriendShareItem } from "./FriendShareItem";


interface props {
  closeSheet: () => void
}

const CRUMBVIEW_SIZE = 300

const BG = Colors.light.darkenVibrant
const BG_FADE = Colors.light.vibrantBackground + "00"

function deriveFriendName(name: string | null, nickname: string | null, defaultName: string = "<no name>") {
  if (name) return name
  else if (nickname) return nickname
  else return defaultName
}

export default function PreviewAndShare({ closeSheet }: props) {
  const { mediaPreview, discardAllMedia } = useMediaStore(useShallow(s => ({
    mediaPreview: s.mediaPreview,
    discardAllMedia: s.discardAllMediaPreview,
  })))
  const insets = useSafeAreaInsets()
  const {
    data: friendsResponse,
    error: friendsError,
    isPending: friendsPending,
    hasNextPage: friendsHasNextPage,
    fetchNextPage: friendsFetchNextPage,
    isFetchingNextPage: friendsIsFetchingNextPage,
    isFetchNextPageError: friendsIsFetchingNextPageError,
  } = useGetFriends("")

  const {
    data: currentUser,
    error: currentUserError,
    isPending: currentUserPending,
  } = useGetUser("")

  type FriendOption = {
    isCurrentUser: boolean
  } & UserDetails;

  const friends: FriendOption[] = [
    { ...currentUser!, isCurrentUser: true },
    ...(friendsResponse?.pages.flatMap((page) =>
      page.Friends.map((f): FriendOption => ({ ...f, isCurrentUser: false }))
    ) ?? []),
  ];

  const {
    address,
    isPending,
    recipients,
    setRecipients,
  } = useShareCrumb(() => { })
  function handleDiscardAllMedia() {
    discardAllMedia()
  }

  useEffect(() => {
    if (mediaPreview.length < 1) closeSheet()
  }, [mediaPreview])

  const usePlural = mediaPreview.length > 1

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
            {friends.map(friend => {
              return (
                <FriendShareItem
                  key={friend.userId}
                  isSelected={recipients.some(r => r.id === friend.userId)}
                  name={`${friend.userId === currentUser?.userId ? "(Me)" : ""} ${deriveFriendName(friend.name, friend.nickname)}`}
                  onChange={s => {
                    if (s) {
                      // select
                      if (!friend.userId) return
                      setRecipients([...recipients, {
                        id: friend.userId!,
                        name: deriveFriendName(friend.name, friend.nickname)
                      }]);
                    } else {
                      // unselect
                      setRecipients(recipients.filter((f) => f.id !== friend.userId));
                    }
                  }}
                  userid={friend.userId ?? ""}
                />
              )
            })}
          </View>

          {friendsHasNextPage && <CustomButton
            type="text"
            slim
            labelText="Load more"
            handleClick={friendsFetchNextPage}
          />}
        </View>
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
        <TouchableOpacity
          style={{
            marginHorizontal: insets.bottom,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            paddingHorizontal: 25,
            backgroundColor: BG,
            marginBottom: insets.bottom / 2,
            borderRadius: 1000,
            overflow: "hidden",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{`Leave Crumb${usePlural ? "s" : ""} Here`}</Text>
          {recipients.length > 1 && <Text style={{ color: "white", fontSize: 16 }}>{` [${recipients.length}]`}</Text>}
        </TouchableOpacity>
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