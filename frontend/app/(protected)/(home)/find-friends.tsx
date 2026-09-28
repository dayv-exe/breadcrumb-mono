import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import ProfileItem from "@/components/profile/ProfileItem";
import ProfileItemSkeleton from "@/components/profile/ProfileItemSkeleton";
import Spacer from "@/components/Spacer";
import CustomHeader from "@/components/views/CustomHeader";
import CustomRefreshableScrollView from "@/components/views/CustomRefreshableScrollView";
import CustomView from "@/components/views/CustomView";
import { useAcceptFriendRequests, useGetFriendRequests, useRejectFriendRequest } from "@/hooks/queries/useFriendRequestsApi";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

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
  const router = useRouter()

  const { data: requests, isPending: requestsIsPending, error: requestError, refetch: requestRefetch } = useGetFriendRequests()
  const { mutate: acceptFR, isPending: acceptFRPending, error: acceptFRError } = useAcceptFriendRequests()
  const { mutate: rejectFR, isPending: rejectFRPending, error: rejectFRError } = useRejectFriendRequest()

  function handleRequestClick(userId: string, nickname: string) {
    router.navigate({
      pathname: "/user-profile",
      params: { userId: userId, tempNickname: nickname }
    })
  }

  function handleAcceptRequest(userid: string) {
    acceptFR(userid, {
      onError: () => {
        Toast.show({
          text1: "🤔 Something went wrong, try again.",
          position: "bottom",
          type: "info",
        })
      }
    })
  }

  function handleRejectRequest(userid: string) {
    rejectFR(userid, {
      onError: () => {
        Toast.show({
          text1: "🤔 Something went wrong, try again.",
          position: "bottom",
          type: "info",
        })
      }
    })
  }

  return (
    <CustomView adaptToTheme horizontalPadding={15}>
      <CustomHeader title="Add Friends" handleBack={() => router.dismiss()} />
      <CustomRefreshableScrollView isRefreshing={requestsIsPending} onRefresh={() => {
        requestRefetch()
      }}>
        <Spacer />
        <View style={styles.suggested}>
          {
            !requests && !requestsIsPending && !requestError && <NoResultComponent />
          }
          {
            !requestsIsPending && requestError && <ErrorComponent />
          }
          {
            requestsIsPending && <LoadingComponent />
          }
          {
            requests &&
            requests.pages.flatMap(
              pages => pages.friendReqs.map(request => (
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
            )
          }
        </View>
        <Spacer />
        {/* <View style={styles.suggested}>
          <CustomLabel bold textAlign="left" adaptToTheme labelText="Suggested friends" />
        </View> */}
        <Spacer />
        <View style={[styles.suggested]}>
          <CustomButton width="100%" slim labelText="Invite contacts" type="less-prominent" handleClick={() => {
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