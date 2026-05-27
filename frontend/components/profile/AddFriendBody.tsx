import { FRIENDSHIP_STATUS } from "@/constants/appConstants";
import { StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomImageButton from "../buttons/CustomImageButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

type props = {
  name: string
  imgSrc: any
  requestStatus: FRIENDSHIP_STATUS
  handleFriendBtnClick: () => void
  handleAcceptReq: () => void
  handleRejectReq: () => void
  acceptPending?: boolean
  rejectPending?: boolean
  handleFriendshipPending?: boolean
}

export default function AddFriendBody({ name, imgSrc, requestStatus, handleFriendBtnClick, handleAcceptReq, handleRejectReq, acceptPending, rejectPending, handleFriendshipPending }: props) {
  const buttonTxt = (): string => {
    return requestStatus === FRIENDSHIP_STATUS.REQUESTED ? "Requested" : "Add Friend"
  }

  return (
    <>
      {requestStatus !== FRIENDSHIP_STATUS.RECEIVED &&
        <View style={styles.container}>
          <CustomImageButton src={imgSrc} size={40} flat />
          <Spacer size="small" />
          <CustomLabel width="80%" fade fontSize={15} textAlign="center" adaptToTheme labelText={`Add ${name.trim()} as a friend and\nbreadcrumb them`} customStyle={{lineHeight: 20}} />
          <Spacer size="small" />
          {requestStatus === FRIENDSHIP_STATUS.NOT_FRIENDS && <CustomButton paddingHorizontal={25} labelText={buttonTxt()} type="less-prominent" slim handleClick={handleFriendBtnClick} isPending={handleFriendshipPending} />}
          {requestStatus !== FRIENDSHIP_STATUS.NOT_FRIENDS && <CustomButton paddingHorizontal={25} labelText={buttonTxt()} type="theme-faded" slim handleClick={handleFriendBtnClick} isPending={handleFriendshipPending} />}
        </View>
      }
      {requestStatus === FRIENDSHIP_STATUS.RECEIVED &&
        <View style={styles.container}>
          <CustomImageButton src={imgSrc} size={40} flat />
          <Spacer size="small" />
          <CustomLabel fade width="70%" fontSize={15} textAlign="center" adaptToTheme labelText={`${name} sent you a friend request`} />
          <Spacer size="small" />
          <View style={{flexDirection: "row"}}>
            <CustomButton paddingHorizontal={25} labelText="Accept" type="less-prominent" slim handleClick={handleAcceptReq} isPending={acceptPending} />
            <Spacer size="small" />
            <CustomButton paddingHorizontal={25} labelText="Decline" type="theme-faded" slim handleClick={handleRejectReq} isPending={rejectPending} />
          </View>
        </View>
      }
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  }
})