import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import ProfileItem from "@/components/profile/ProfileItem";
import ProfileItemSkeleton from "@/components/profile/ProfileItemSkeleton";
import Spacer from "@/components/Spacer";
import CustomRefreshableScrollView from "@/components/views/CustomRefreshableScrollView";
import CustomView from "@/components/views/CustomView";
import { useAcceptFriendRequest, useGetAllFriendRequests, useRejectFriendRequest } from "@/hooks/queries/useFriendshipAction";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

const icons = {
  next: {
    light: require("../../assets/images/icons/next_sel_light.png"),
    dark: require("../../assets/images/icons/next_sel_dark.png")
  },
  back: {
    light: require("../../assets/images/icons/close_unsel_light.png"),
    dark: require("../../assets/images/icons/close_unsel_dark.png")
  },
  contacts: {
    light: require("../../assets/images/icons/contacts_sel_light.png"),
    dark: require("../../assets/images/icons/contacts_sel_light.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

function NoResultComponent() {
  return (
    <>
      <CustomLabel adaptToTheme width="85%" fontSize={15} labelText={`When someone sends you a friend request, it will show up here 😉`} textAlign="center" />
      <Spacer />
    </>
  )
}

function ErrorComponent() {
  return (
    <>
      <CustomLabel adaptToTheme width="100%" fontSize={35} labelText={`⚠️`} textAlign="center" />
      <CustomLabel adaptToTheme width="100%" labelText={`Something's not right.\nPull down to refresh`} textAlign="center" fade />
      <Spacer />
    </>
  )
}

function LoadingComponent() {
  return (
    <>
      <ProfileItemSkeleton />
      <Spacer size="small" />
    </>
  )
}

export default function FindFriendsScreen() {
  const focused = useIsFocused()
  const router = useRouter()

  const { data: requests, isPending: isPending, refetch } = useGetAllFriendRequests()
  const { mutate: acceptFriendReq, isPending: acceptPending } = useAcceptFriendRequest()
  const { mutate: rejectFriendReq, isPending: rejectPending } = useRejectFriendRequest()

  useEffect(() => {
    if (focused) {
      refetch()
    }
  }, [focused])

  function handleRequestClick(userId: string, nickname: string) {
    router.navigate({
      pathname: "/user-profile",
      params: { userId: userId, tempNickname: nickname }
    })
  }

  function handleAcceptRequest(userid: string) {
    acceptFriendReq(userid, {
      onSuccess: res => {
        if (res.error) {
          Toast.show({
            text1: "🤔 Something went wrong, try again.",
            position: "bottom",
            type: "info",
          })
        } else {
          refetch()
        }
      }
    })
  }

  function handleRejectRequest(userid: string) {
    rejectFriendReq(userid, {
      onSuccess: res => {
        if (res.error) {
          Toast.show({
            text1: "🤔 Something went wrong, try again.",
            position: "bottom",
            type: "info",
          })
        } else {
          refetch()
        }
      }
    })
  }

  return (
    <CustomView adaptToTheme horizontalPadding={15}>
      <CustomRefreshableScrollView isRefreshing={isPending} onRefresh={() => {
        refetch()
      }}>
        <Spacer />
        <View style={styles.suggested}>
          {
            !isPending && requests && !requests.error && !requests.users && <NoResultComponent />
          }
          {
            !isPending && requests && requests.error && <ErrorComponent />
          }
          {
            isPending && <LoadingComponent />
          }
          {
            !isPending && requests && !requests.error && requests.users &&
            requests.users.map(request => (
              <View key={request.userId} style={{ width: "100%" }}>
                <ProfileItem
                  key={request.userId}
                  handleClick={() => handleRequestClick(request.userId!, request.nickname!)}
                  userDetails={request}
                  showFriendReqOpts={true}
                  handleAccept={() => handleAcceptRequest(request.userId ?? "")}
                  handleReject={() => handleRejectRequest(request.userId ?? "")}
                />
                <Spacer />
              </View>
            ))
          }
        </View>
        <Spacer />
        <View style={styles.suggested}>
          <CustomLabel bold textAlign="left" adaptToTheme labelText="Suggested friends" />
        </View>
        <Spacer />
        <View style={[styles.suggested]}>
          <CustomButton width="100%" imgSrc={getIconImage("contacts", false)} slim labelText="Invite contacts" type="less-prominent" handleClick={() => {
            router.push("/invite-friends")
          }} />
        </View>
        <Spacer />
      </CustomRefreshableScrollView>
    </CustomView>
  )
}

const styles = StyleSheet.create({
  suggested: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  }
})