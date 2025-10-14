import { UserDetails } from "@/api/models/userDetails";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import ProfileItem from "@/components/profile/ProfileItem";
import ProfileItemSkeleton from "@/components/profile/ProfileItemSkeleton";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import { useGetAllFriends } from "@/hooks/queries/useFriendshipAction";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, ListRenderItem, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      <CustomLabel adaptToTheme labelText="No friends to show" textAlign="center" fontSize={17} fade />
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
  const { data: response, error: friendsError, isPending: isPending, refetch } = useGetAllFriends(accountId)
  const mode = useColorScheme()
  const router = useRouter()

  const renderFriends: ListRenderItem<UserDetails> = ({ item }) => (
    <ProfileItem userDetails={item} handleClick={() => {
      router.push({
        pathname: "/user-profile",
        params: { userId: item.userId, tempNickname: item.nickname }
      })
    }} />
  )

  return (
    <CustomView adaptToTheme horizontalPadding={0}>
      <SafeAreaView style={{ alignItems: "center", justifyContent: "center" }}>
        {/* header */}
        <View style={styles.header}>
          <CustomImageButton flat handleClick={() => {
            router.dismiss()
          }} src={getIconImage("back", mode === "light")} />
          <CustomLabel labelText={nickname} bold adaptToTheme textAlign="center" />
          <CustomImageButton flat src="" />
        </View>
        <Spacer />
        <CustomView horizontalPadding={20} adaptToTheme>
          {response && !isPending && !friendsError && !response.users &&
            <NoFriendsComponent />
          }
          {response && !isPending && !friendsError && response.users &&
            <FlatList
              refreshing={isPending}
              onRefresh={refetch}
              data={response.users}
              renderItem={renderFriends}
            />
          }
          {
            isPending &&
            <LoadingComponent />
          }
        </CustomView>
      </SafeAreaView>
    </CustomView>
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
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "column",
  }
})