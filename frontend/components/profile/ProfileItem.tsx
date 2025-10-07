import { UserDetails } from "@/api/models/userDetails";
import { userSearchDetails } from "@/api/models/userSearchDetails";
import { useColorScheme } from "@/hooks/useColorScheme.web";
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
  userDetails: UserDetails | userSearchDetails
  showFriendReqOpts?: boolean
  handleClick: () => void
  handleAccept?: () => void
  handleReject?: () => void
}

export default function ProfileItem({ userDetails, showFriendReqOpts = false, handleClick, handleAccept, handleReject }: props) {
  const mode = useColorScheme()

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.container} onPress={handleClick}>
        <CustomProfilePictureCircle size={60} />
        <View style={styles.names}>
          <CustomLabel padding={0} adaptToTheme bold labelText={userDetails.nickname!} fontSize={15} />
          <Spacer size="tiny" />
          {userDetails.name && <CustomLabel padding={0} adaptToTheme labelText={userDetails.name} fontSize={15} fade />}
        </View>
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
    justifyContent: "flex-start",
    flexShrink: 1,
  },
  names: {
    width: "100%",
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