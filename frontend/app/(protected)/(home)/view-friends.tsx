import { UserDetails } from "@/api/models/userDetails";
import CustomButton from "@/components/buttons/CustomButton";
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
import { ChevronLeftIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  const { data: friendsData, refetch: friendsRefetch, fetchNextPage: friendsFetchNextPage, hasNextPage: friendsHasNextPage, isFetchingNextPage: friendsIsFetchingNextPage, isFetching: friendsIsFetching, error: friendsError } = useGetFriends(accountId)

  const { data: requests, refetch: requestRefetch, fetchNextPage: requestFetchNextPage, hasNextPage: requestHasNextPage, isFetchingNextPage: requestIsFetchingNextPage, isFetching: requestIsFetching, error: requestError } = useGetFriendRequests()

  const isMyProfile = useIsMyProfile(accountId)
  const router = useRouter()
  const mode = useColorScheme()
  const insets = useSafeAreaInsets()
  const darkBgCol = useThemeColor({}, "darkBackground")
  const textCol = useThemeColor({}, "text")

  const friendRequests = requests?.pages.flatMap(pages => pages.friendReqs.map(p => (p)))

  const friends = friendsData?.pages.flatMap(pages => pages.Friends.map(f => (f)))

  const sections: Section[] = [
    {
      key: "friend requests",
      type: "paginated",
      title: "Friend requests",
      data: friendRequests || [],
      hidden: !isMyProfile || (friendRequests?.length === 0 && !requestHasNextPage) || requestError !== null,
      keyExtractor: (item: UserDetails) => item.userId ?? "",
      hasMore: requestHasNextPage ?? false,
      isFetchingMore: requestIsFetchingNextPage || requestIsFetching,
      onEndReached: requestFetchNextPage,
      renderItem: (item: UserDetails) => {
        return (
          <ProfileItem showAddFriendOpt={true} userDetails={item} handleClick={() => {
            router.push({
              pathname: "/(protected)/(home)/user-profile",
              params: { userid: item.userId, tempNickname: item.nickname }
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
      hidden: (friends?.length === 0 && !friendsHasNextPage) || friendsError !== null,
      keyExtractor: (item: UserDetails) => item.userId ?? "",
      hasMore: friendsHasNextPage ?? false,
      isFetchingMore: friendsIsFetchingNextPage || friendsIsFetching,
      onEndReached: friendsFetchNextPage,
      renderItem: (item: UserDetails) => {
        return (
          <ProfileItem showAddFriendOpt={true} userDetails={item} handleClick={() => {
            router.push({
              pathname: "/user-profile",
              params: { userid: item.userId, tempNickname: item.nickname }
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
      <CustomButton
        freed
        customStyle={{
          backgroundColor: darkBgCol,
          position: "absolute",
          top: insets.top - 7,
        }} handleClick={() => router.dismiss()}>
        <ChevronLeftIcon stroke={textCol} strokeWidth={2.5} />
      </CustomButton>
      <CustomLabel labelText={nickname} adaptToTheme textAlign="center" bold />
      {
        friends && friends.length < 1 && friendRequests && (friendRequests.length < 1 || !isMyProfile) &&
        <View style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}>
          <CustomLabel labelText="👻" textAlign="center" adaptToTheme fontSize={40} />
          <Spacer size="tiny" />
          <CustomLabel fontSize={16} adaptToTheme textAlign="center" labelText={`nothing to see here`} />
        </View>
      }
      <Spacer />
      <ElevatedSectionedScrollView
        sections={sections}
        onRefresh={async () => {
          friendsRefetch()
          requestRefetch()
        }}
        style={{
          flex: 1,
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