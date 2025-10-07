import { StyleSheet, View } from "react-native"
import CustomLabel from "../CustomLabel"
import CustomImageButton from "../buttons/CustomImageButton"

type props = {
  nickname: string
  friendsIconSrc: any
  moreOptionsIconSrc: any
  backButtonIconSrc?: any
  handleMoreOptionsClick: () => void
  handleFriendsClick: () => void
  handleBackBtnClick?: () => void
}

export default function ProfileHeader({ nickname, friendsIconSrc, moreOptionsIconSrc, backButtonIconSrc, handleFriendsClick, handleMoreOptionsClick, handleBackBtnClick }: props) {
  const showBackBtn = backButtonIconSrc && handleBackBtnClick

  return (
    <View style={[styles.header, {
      paddingLeft: showBackBtn ? 0 : 20,
      paddingRight: 20,
    }]}>
      <View style={styles.nameContainer}>
        {showBackBtn && <CustomImageButton size={32} handleClick={handleBackBtnClick} flat src={backButtonIconSrc} />}
        <CustomLabel fitContent adaptToTheme bold labelText={nickname} />
      </View>
      <View style={{ flexDirection: "row" }}>
        <CustomImageButton src={friendsIconSrc} flat size={18} type="theme-faded" />
        <CustomImageButton handleClick={handleMoreOptionsClick} flat src={moreOptionsIconSrc} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  }
})