import { UserDetails } from "@/api/models/userDetails";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import ProfileItem from "@/components/profile/ProfileItem";
import ProfileItemSkeleton from "@/components/profile/ProfileItemSkeleton";
import Spacer from "@/components/Spacer";
import { ElevatedSectionedScrollView, Section } from "@/components/views/ElevatedSectionedScrollView";
import { useGetFriendRequests } from "@/hooks/queries/useFriendRequestsApi";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useIsMyProfile } from "@/hooks/useIsMyProfile";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const icons = {
  options: {
    light: require("../../assets/images/icons/options_sel_light.png"),
    dark: require("../../assets/images/icons/options_sel_dark.png")
  },
  removeFriend: {
    light: require("../../assets/images/icons/removefriend_sel_light.png"),
    dark: require("../../assets/images/icons/removefriend_sel_dark.png"),
  },
  back: {
    light: require("../../assets/images/icons/back_sel_light.png"),
    dark: require("../../assets/images/icons/back_sel_dark.png")
  },
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

function NoFriendsComponent() {
  return (
    <View style={styles.noFriends}>
      <Spacer />
      <CustomLabel adaptToTheme labelText="👻" textAlign="center" fontSize={30} />
      <CustomLabel adaptToTheme labelText="Nothing to see here" textAlign="center" fontSize={17} fade />
    </View>
  )
}

function ErrorComponent() {
  return (
    <View style={styles.noFriends}>
      <Spacer />
      <CustomLabel adaptToTheme labelText="🫣" textAlign="center" fontSize={30} />
      <CustomLabel adaptToTheme labelText="No friends to show" textAlign="center" fontSize={17} fade />
    </View>
  )
}

function LoadingComponent() {
  return (
    <View style={styles.noFriends}>
      <ProfileItemSkeleton />
      <Spacer size="small" />
      <ProfileItemSkeleton />
    </View>
  )
}

export default function ViewFriendsScreen() {
  const { accountId, nickname } = useLocalSearchParams<{ accountId: string, nickname: string }>()
  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, error } = useGetFriends(accountId)
  const { data: requests, refetch: refetchRequests, fetchNextPage: fetchNextReq, hasNextPage: reqHasNextPage, isFetchingNextPage: isFetchingNextReqPage, isFetching: isFetchingReq, error: reqErr } = useGetFriendRequests()
  const isMyProfile = useIsMyProfile(accountId)
  const router = useRouter()
  const mode = useColorScheme()
  const insets = useSafeAreaInsets()
  const darkBgCol = useThemeColor({}, "darkBackground")

  const friends: UserDetails[] = [
    ...(data?.pages.flatMap((page) =>
      page.message.map((f): UserDetails => f)
    ) ?? []),
  ]

  const fReq: UserDetails[] = [
    ...(requests?.pages.flatMap((page) =>
      page.message.map((r): UserDetails => r)
    ) ?? []),
  ]

  const sections: Section[] = [
    {
      key: "friend requests",
      type: "paginated",
      title: "Pending friend requests",
      data: fReq ?? [],
      hidden: !isMyProfile || (fReq.length === 0 && !hasNextPage) || error !== null,
      keyExtractor: (item: UserDetails) => item.userId ?? "",
      hasMore: hasNextPage ?? false,
      isFetchingMore: isFetchingNextPage || isFetching,
      onEndReached: fetchNextPage,
      renderItem: (item: UserDetails) => {
        console.log("FRIENDS")
        console.log(item)
        return (
          <ProfileItem showAddFriendOpt={true} userDetails={item} handleClick={() => {
            router.push({
              pathname: "/user-profile",
              params: { userId: item.userId, tempNickname: item.nickname }
            })
          }} />
        )
      },
    },
    {
      key: "friends",
      type: "paginated",
      title: "Friends",
      data: friends ?? [],
      hidden: (friends.length === 0 && !hasNextPage) || error !== null,
      keyExtractor: (item: UserDetails) => item.userId ?? "",
      hasMore: hasNextPage ?? false,
      isFetchingMore: isFetchingNextPage || isFetching,
      onEndReached: fetchNextPage,
      renderItem: (item: UserDetails) => {
        console.log("FRIENDS")
        console.log(item)
        return (
          <ProfileItem showAddFriendOpt={true} userDetails={item} handleClick={() => {
            router.push({
              pathname: "/user-profile",
              params: { userId: item.userId, tempNickname: item.nickname }
            })
          }} />
        )
      },
    },
  ]

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: darkBgCol
    }}>
      <CustomImageButton customStyle={{
        backgroundColor: darkBgCol,
        position: "absolute",
        top: insets.top - 7,
      }} src={getIconImage("back", mode === "light")} flat handleClick={() => router.dismiss()} />
      <CustomLabel labelText={nickname} adaptToTheme textAlign="center" bold />
      {
        friends.length < 1 && (fReq.length < 1 || !isMyProfile) &&
        <View style={{
          flex: 1,
          marginTop: 15,
          alignItems: "center",
          justifyContent: "center"
        }}>
          <CustomLabel labelText="👻" textAlign="center" adaptToTheme fontSize={37} />
          <CustomLabel adaptToTheme textAlign="center" fade labelText="Nothing to see here" />
        </View>
      }
      <ElevatedSectionedScrollView
        sections={sections}
        onRefresh={async () => {
          refetch()
          refetchRequests()
        }}
        style={{
          flex: 1,
          paddingHorizontal: 15,
          paddingTop: 15,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  noFriends: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "column",
  }
})