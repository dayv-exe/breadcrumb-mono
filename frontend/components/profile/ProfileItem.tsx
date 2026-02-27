import { UserDetails } from "@/api/models/userDetails";
import { FRIENDSHIP_STATUS, ShowToast } from "@/constants/appConstants";
import { buttonTypes } from "@/constants/buttonTypes";
import { useSendFriendRequest, useUnsendFriendRequest } from "@/hooks/queries/useFriendRequestsApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useIsMyProfile } from "@/hooks/useIsMyProfile";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomProfilePictureCircle from "./CustomProfilePictureCircle";

const icons = {
  accept: {
    light: require("../../assets/images/icons/fillaccept_sel_light.png"),
    dark: require("../../assets/images/icons/fillaccept_sel_dark.png")
  },
  reject: {
    light: require("../../assets/images/icons/fillclose_sel_light.png"),
    dark: require("../../assets/images/icons/fillclose_sel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

type props = {
  userDetails: UserDetails
  showFriendReqOpts?: boolean
  showAddFriendOpt?: boolean
  handleClick: () => void
  handleAccept?: () => void
  handleReject?: () => void
}


type fabProps = {
  isPending: boolean
  handleClick: () => void
  text: string
  btnType: buttonTypes
}
function FriendshipActionBtn({ handleClick, text, btnType, isPending }: fabProps) {

  return (
    <CustomButton adaptToTheme={btnType === "text" ? true : false} isPending={isPending} handleClick={handleClick} labelText={text} type={btnType} customStyle={{
      padding: 12
    }}
      customTextStyle={{
        fontSize: 12,
        fontStyle: btnType === "text" ? "italic" : "normal",
        opacity: btnType === "text" ? .5 : 1
      }}
    />
  )
}

export default function ProfileItem({ userDetails, showFriendReqOpts = false, handleClick, handleAccept, handleReject, showAddFriendOpt = false }: props) {
  const { mutate: sendFriendRequest, isPending: SendFriendReqPending } = useSendFriendRequest()
  const { mutate: cancelFriendRequest, isPending: cancelFriendReqPending } = useUnsendFriendRequest()
  const mode = useColorScheme()
  const isMyProfile = useIsMyProfile(userDetails.userId ?? "")
  const [friendshipBtnTxt, setFriendshipBtnTxt] = useState(getText())
  const [friendshipBtnType, setFriendshipBtnType] = useState<buttonTypes>(getButtonType())

  function getText(): string {
    switch (userDetails.friends) {
      case FRIENDSHIP_STATUS.NOT_FRIENDS:
        return "Add friend"

      case FRIENDSHIP_STATUS.RECEIVED:
        return "Pending"

      case FRIENDSHIP_STATUS.REQUESTED:
        return "Requested"

      case FRIENDSHIP_STATUS.FRIENDS:
        return "Friend"

      default:
        return ""
    }
  }

  function getButtonType(): buttonTypes {
    return userDetails.friends === FRIENDSHIP_STATUS.NOT_FRIENDS ? "less-prominent" : userDetails.friends === FRIENDSHIP_STATUS.FRIENDS ? "text" : "theme-faded"
  }

  function handleFriendActionClick() {
    if (userDetails.friends === FRIENDSHIP_STATUS.NOT_FRIENDS) {
      // request to be friends
      sendFriendRequest(userDetails.userId ?? "", {
        onSuccess: res => {
          if (!res.error) {
            setFriendshipBtnTxt("Requested")
            setFriendshipBtnType("theme-faded")
            userDetails.friends = FRIENDSHIP_STATUS.REQUESTED
          } else {
            ShowToast("Something went wrong.")
          }
        },
        onError: () => {
          ShowToast("Something went wrong.")
        }
      })
    } else if (userDetails.friends === FRIENDSHIP_STATUS.REQUESTED) {
      // cancel request sent
      cancelFriendRequest(userDetails.userId ?? "", {
        onSuccess: res => {
          if (!res.error) {
            setFriendshipBtnTxt("Add friend")
            setFriendshipBtnType("less-prominent")
            userDetails.friends = FRIENDSHIP_STATUS.NOT_FRIENDS
          } else {
            ShowToast("Something went wrong.")
          }
        }
      })
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
      }} onPress={handleClick}>
        <View style={{
          flexShrink: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "row",
        }}>
          <CustomProfilePictureCircle nickname={userDetails.nickname} size={60} />
          <View style={styles.names}>
            <CustomLabel padding={0} adaptToTheme labelText={userDetails.nickname!} fontSize={15} bold />
            <Spacer size="tiny" />
            {userDetails.name && <CustomLabel padding={0} adaptToTheme labelText={userDetails.name} fontSize={15} />}
          </View>
        </View>

        {!isMyProfile && <FriendshipActionBtn handleClick={handleFriendActionClick} btnType={friendshipBtnType} text={friendshipBtnTxt} isPending={SendFriendReqPending || cancelFriendReqPending} />}

      </TouchableOpacity>

      {showFriendReqOpts && <View style={styles.reqOptsContainer}>
        {handleAccept && <CustomButton handleClick={handleAccept} type="theme-faded" labelText="Accept" fontSize={13} slim />}
        <Spacer size="small" />
        {handleReject && <CustomButton handleClick={handleReject} type="text" labelText="" imgSrc={getIconImage("reject", mode === "light")} slim paddingHorizontal={0} />}
      </View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  names: {
    width: "auto",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginLeft: 10,
    flexShrink: 1,
  },
  reqOptsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  }
})