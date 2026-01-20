import { UserDetails } from "@/api/models/userDetails";
import Spacer from "@/components/Spacer";
import CustomView from "@/components/views/CustomView";
import { FRIENDSHIP_STATUS, ShowToast } from "@/constants/appConstants";
import { useAcceptFriendRequests, useRejectFriendRequest, useSendFriendRequest, useUnsendFriendRequest } from "@/hooks/queries/useFriendRequestsApi";
import { useRemoveFriend } from "@/hooks/queries/useFriendsApi";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useIsMyProfile } from "@/hooks/useIsMyProfile";
import { useLocationStore } from "@/utils/useLocationStore";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useBottomSheet } from "../bottomsheet/BottomSheetContext";
import CustomButton from "../buttons/CustomButton";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import Skeleton from "../skeletons/Skeleton";
import CustomRefreshableScrollView from "../views/CustomRefreshableScrollView";
import AddFriendBody from "./AddFriendBody";
import CustomProfilePictureCircle from "./CustomProfilePictureCircle";

const icons = {
  options: {
    light: require("../../assets/images/icons/options_sel_light.png"),
    dark: require("../../assets/images/icons/options_sel_dark.png")
  },
  addFriends: {
    light: require("../../assets/images/icons/addfriend_sel_light.png"),
    dark: require("../../assets/images/icons/addfriend_sel_dark.png")
  },
  pendingFriend: {
    light: require("../../assets/images/icons/pendingfriend_sel_light.png"),
    dark: require("../../assets/images/icons/pendingfriend_sel_dark.png"),
  },
  removeFriend: {
    light: require("../../assets/images/icons/removefriend_sel_light.png"),
    dark: require("../../assets/images/icons/removefriend_sel_dark.png"),
  },
  message: {
    light: require("../../assets/images/icons/messages_sel_light.png"),
    dark: require("../../assets/images/icons/messages_sel_dark.png")
  },
  back: {
    light: require("../../assets/images/icons/back_sel_light.png"),
    dark: require("../../assets/images/icons/back_sel_dark.png")
  },
  bigAddFriend: {
    light: require("../../assets/images/icons/big_addfriend_sel_light.png"),
    dark: require("../../assets/images/icons/big_addfriend_sel_dark.png")
  },
  menu: {
    light: require("../../assets/images/icons/menu_unsel_light.png"),
    dark: require("../../assets/images/icons/menu_unsel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

type props = {
  userId: string
  tempNickname?: string
  showBackButton?: boolean
}

type errProps = {
  showBackButton?: boolean
  handleBackClick: () => void
  mode: string
  isPending: boolean
  handleRefresh: () => void
}
function ErrorComponent({ showBackButton, handleBackClick, mode, isPending, handleRefresh }: errProps) {
  return (
    <CustomView adaptToTheme horizontalPadding={0}>
      <SafeAreaView style={[
        styles.container,
      ]}>
        <View style={[styles.header, {
          paddingLeft: showBackButton ? 0 : 20,
          paddingRight: 20,
        }]}>
          <View style={styles.nameContainer}>
            {showBackButton && <CustomImageButton size={27} flat src={getIconImage("back", mode === "light")} handleClick={handleBackClick} />}
            <CustomLabel fitContent adaptToTheme bold fade italic labelText={"<user not found>"} />
          </View>
          <View style={{ flexDirection: "row" }}>

          </View>
        </View>

        <Spacer size="small" />

        <CustomRefreshableScrollView isRefreshing={isPending} onRefresh={handleRefresh}>
          <Spacer size="small" />
          <View style={styles.profileHeader}>
            <CustomProfilePictureCircle nickname={"00"} size={100} />
            <Spacer />
            <View style={styles.profileAside}>
              <CustomLabel fontSize={18.5} fade italic bold labelText={"who?"} textAlign="left" adaptToTheme />
              <Spacer size="small" />
              <CustomButton labelText={"Nothing to see here"} squashed type="theme-faded" />
            </View>
          </View>
          <Spacer />
          <View style={styles.bio}>
            <CustomLabel width={"80%"} fontSize={15} textAlign="left" labelText={"No bio yet"} fade italic adaptToTheme />
          </View>
        </CustomRefreshableScrollView>
      </SafeAreaView>
    </CustomView>
  )
}

export default function BaseProfile({ userId, tempNickname, showBackButton = false }: props) {
  const mode = useColorScheme()
  const router = useRouter()
  const [friendshipStatus, setFriendshipStatus] = useState<FRIENDSHIP_STATUS>(FRIENDSHIP_STATUS.NOT_FRIENDS)
  const { data: userData, error, isPending, refetch } = useGetUser(userId)
  const isMyProfile = useIsMyProfile(userId)
  const { mutate: sendFriendReq, isPending: sendReqPending } = useSendFriendRequest()
  const { mutate: unsendFriendRequest, isPending: unsendReqPending } = useUnsendFriendRequest()
  const { mutate: acceptFriendReq, isPending: acceptReqPending } = useAcceptFriendRequests()
  const { mutate: rejectFriendReq, isPending: rejectReqPending } = useRejectFriendRequest()
  const { mutate: endFriendship, isPending: endFriendshipPending } = useRemoveFriend()
  const { openSheet } = useBottomSheet()

  const user = useRef<UserDetails>(null)
  const { address } = useLocationStore()

  const handleShowOptions = () => {
    if (userData?.message) {
      const u = userData.message
      router.push({
        pathname: "/profile-settings",
        params: {
          userid: u.userId,
          dpUrl: u.dpUrl,
          defaultPicColors: u.defaultPicColors,
          nickname: u.nickname,
          name: u.name,
          bio: u.bio,
          email: u.email,
          birthdate: u.birthdate
        }
      })
    }
  }

  const handleBackClick = () => {
    router.dismiss()
  }

  const getFriendsText = (): string => {
    return "View friends"
  }

  const getName = (): string => {
    if (isPending) {
      return "loading..."
    }
    if (userData?.message?.name) return userData?.message?.name
    else if (userData?.message?.nickname) return userData.message.nickname
    else return "<undefined>"
  }

  const getNickname = (): string => {
    if (isPending) {
      return "loading..."
    }
    return userData?.message?.nickname ?? "<undefined>"
  }

  async function handleRefresh() {
    refetch()
  }

  async function handleFriendshipAction() {
    if (friendshipStatus === FRIENDSHIP_STATUS.NOT_FRIENDS) {
      // request if not yet friends
      sendFriendReq(userId, {
        onSuccess: res => {
          if (res.error) {
            Toast.show({
              text1: `🤔 Something went wrong, try again.`,
              position: "bottom",
              type: "info"
            })
          } else {
            setFriendshipStatus(FRIENDSHIP_STATUS.REQUESTED)
          }
        }
      })
    } else if (friendshipStatus === FRIENDSHIP_STATUS.REQUESTED) {
      // unsend request if sent
      unsendFriendRequest(userId, {
        onSuccess: res => {
          if (res.error) {
            Toast.show({
              text1: "🤔 hmm, something is not right here.",
              position: "bottom",
              type: "info"
            })
          } else {
            setFriendshipStatus(FRIENDSHIP_STATUS.NOT_FRIENDS)
          }
        }
      })
    }
  }

  async function handleAcceptFriendRequest() {
    if (friendshipStatus === FRIENDSHIP_STATUS.RECEIVED) {
      acceptFriendReq(userId, {
        onSuccess: res => {
          if (res.error) {
            Toast.show({
              text1: "😬 Something went wrong, try again.",
              position: "bottom",
              type: "info"
            })
          } else {
            setFriendshipStatus(FRIENDSHIP_STATUS.FRIENDS)
          }
        }
      })
    }
  }

  async function handleRejectFriendRequest() {
    if (friendshipStatus === FRIENDSHIP_STATUS.RECEIVED) {
      rejectFriendReq(userId, {
        onSuccess: res => {
          if (res.error) {
            ShowToast("Something went wrong try again.")
          } else {
            setFriendshipStatus(FRIENDSHIP_STATUS.NOT_FRIENDS)
          }
        },
        onError: err => {
          ShowToast(err.message)
        }
      })
    }
  }

  function handleEndFriendship() {
    if (friendshipStatus === FRIENDSHIP_STATUS.FRIENDS) {
      endFriendship(userId, {
        onSuccess: res => {
          if (res.error) {
            Toast.show({
              text1: "🤔 Something went wrong.",
              type: "info",
              position: "bottom"
            })
          } else {
            setFriendshipStatus(FRIENDSHIP_STATUS.NOT_FRIENDS)
          }
        }
      })
    }
  }

  function getFriendBtnIcon() {
    if (friendshipStatus === FRIENDSHIP_STATUS.NOT_FRIENDS) {
      return getIconImage("addFriends", mode === "light")
    } else if (friendshipStatus === FRIENDSHIP_STATUS.REQUESTED) {
      return getIconImage("pendingFriend", mode === "light")
    } else if (friendshipStatus === FRIENDSHIP_STATUS.FRIENDS) {
      return getIconImage("removeFriend", mode === "light")
    }
  }

  function handleFriendsClick() {
    router.push({
      pathname: "/view-friends",
      params: { accountId: userId, nickname: getNickname() }
    })
  }

  useEffect(() => {
    if (userData && userData.message && !isMyProfile) {
      user.current = userData.message
      switch (userData.message.friends) {
        case FRIENDSHIP_STATUS.FRIENDS:
          setFriendshipStatus(FRIENDSHIP_STATUS.FRIENDS)
          break;

        case FRIENDSHIP_STATUS.NOT_FRIENDS:
          setFriendshipStatus(FRIENDSHIP_STATUS.NOT_FRIENDS)
          break;

        case FRIENDSHIP_STATUS.RECEIVED:
          setFriendshipStatus(FRIENDSHIP_STATUS.RECEIVED)
          break;

        case FRIENDSHIP_STATUS.REQUESTED:
          setFriendshipStatus(FRIENDSHIP_STATUS.REQUESTED)
          break;

        default:
          console.log("unable to determine friendship status!")
          break;
      }
    }

    if ((userData && userData.error) || error) {
      Toast.show({
        text1: "🚫 Something went wrong",
        autoHide: true,
        type: "info",
        position: "bottom",
        swipeable: false,
        visibilityTime: 3000
      })
    }

  }, [isMyProfile, userData])

  return (
    <>
      {!userData?.error &&
        <CustomView horizontalPadding={0} adaptToTheme>
          <SafeAreaView style={[
            styles.container,
          ]}>
            <View style={[styles.header, {
              paddingLeft: showBackButton ? 0 : 20,
              paddingRight: 20,
            }]}>
              <View style={styles.nameContainer}>
                {showBackButton && <CustomImageButton size={27} flat src={getIconImage("back", mode === "light")} handleClick={handleBackClick} />}
                {/* NICKNAME LABEL */}
                {!isPending && <CustomLabel fitContent adaptToTheme bold labelText={getNickname()} />}
                {isPending && !tempNickname && <Skeleton height={20} borderRadius={10} />}
                {isPending && tempNickname && <CustomLabel fitContent adaptToTheme bold labelText={tempNickname} />}
              </View>
              <View style={{ flexDirection: "row" }}>
                {(!isMyProfile && friendshipStatus === FRIENDSHIP_STATUS.NOT_FRIENDS) && <CustomImageButton src={getFriendBtnIcon()} flat size={18} type="theme-faded" isPending={sendReqPending} handleClick={handleFriendshipAction} />}
                {(!isMyProfile && friendshipStatus === FRIENDSHIP_STATUS.FRIENDS) && <CustomImageButton src={getFriendBtnIcon()} flat size={18} type="theme-faded" isPending={endFriendshipPending} handleClick={handleEndFriendship} />}
                <CustomImageButton flat src={getIconImage(isMyProfile ? "menu" : "options", mode === "light")} handleClick={() => {
                  if (isMyProfile) {
                    handleShowOptions()
                  } else {
                    openSheet({
                      content: (
                        <View style={{ alignItems: "center", justifyContent: "center", }}>
                          <CustomLabel fade fontSize={13} textAlign="center" width="80%" adaptToTheme labelText="We will not notify them when you take any of these actions" />
                          <Spacer />
                          {friendshipStatus === FRIENDSHIP_STATUS.FRIENDS && <CustomButton adaptToTheme labelText="Restrict" type="text" />}

                          {friendshipStatus === FRIENDSHIP_STATUS.FRIENDS && <CustomButton adaptToTheme labelText="End friendship" type="text" />}

                          {friendshipStatus === FRIENDSHIP_STATUS.REQUESTED && <CustomButton adaptToTheme labelText="Cancel request" type="text" />}

                          {friendshipStatus === FRIENDSHIP_STATUS.RECEIVED && <CustomButton adaptToTheme labelText="Reject friend request" type="text" />}

                          <CustomButton adaptToTheme labelText="Report" type="text" />

                          <CustomButton adaptToTheme labelText="Block" type="text" customTextStyle={{color: "red"}} />
                          <Spacer />
                        </View>
                      ),
                      dynamicHeight: true
                    })
                  }
                }} />
              </View>
            </View>

            <Spacer size="small" />

            <CustomRefreshableScrollView isRefreshing={isPending} onRefresh={handleRefresh}>
              <Spacer size="small" />
              <View style={styles.profileHeader}>
                <CustomProfilePictureCircle size={100} nickname={userData?.message?.nickname} />
                <Spacer />
                <View style={styles.profileAside}>
                  {!isPending && <CustomLabel fontSize={18.5} bold labelText={getName()} textAlign="left" adaptToTheme />}
                  {isPending && <Skeleton height={20} width={100} borderRadius={10} />}
                  <Spacer size="small" />
                  {!isPending && <CustomButton labelText={getFriendsText()} handleClick={handleFriendsClick} squashed type="theme-faded" />}
                  {isPending && <Skeleton height={20} width={60} borderRadius={10} />}
                </View>
              </View>
              <Spacer size="small" />
              {!isPending && <View style={styles.bio}>
                {isMyProfile && address && <CustomLabel fontSize={12} fade adaptToTheme labelText={address} />}
                {userData?.message?.bio && <CustomLabel width={"90%"} fontSize={16} textAlign="left" labelText={userData.message.bio ?? ""} adaptToTheme />}
                {!userData?.message?.bio && <CustomLabel width={"80%"} fontSize={16} textAlign="left" labelText={"No bio yet"} fade italic adaptToTheme />}
              </View>}
              {(!isMyProfile && friendshipStatus !== FRIENDSHIP_STATUS.FRIENDS && !isPending) &&
                <>
                  <Spacer size="big" />
                  <Spacer size="big" />
                  <AddFriendBody imgSrc={getIconImage("bigAddFriend", mode === "light")} name={getName() ?? getNickname()} requestStatus={friendshipStatus} handleFriendBtnClick={handleFriendshipAction} handleAcceptReq={handleAcceptFriendRequest} handleRejectReq={handleRejectFriendRequest}
                    acceptPending={acceptReqPending}
                    rejectPending={rejectReqPending}
                    handleFriendshipPending={sendReqPending || unsendReqPending}
                  />
                </>
              }
            </CustomRefreshableScrollView>
          </SafeAreaView>
        </CustomView>
      }

      {userData?.error &&
        <ErrorComponent handleBackClick={handleBackClick} handleRefresh={handleRefresh} isPending={isPending} mode={mode ?? "light"} showBackButton={showBackButton} />
      }
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    width: "100%"
  },
  header: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  profileHeader: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 20
  },
  profileAside: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center"
  },
  bio: {
    width: "100%",
    paddingHorizontal: 20
  },
})