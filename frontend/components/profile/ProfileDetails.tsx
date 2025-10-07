import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomButton from "../buttons/CustomButton";
import CustomScrollView from "../views/CustomScrollView";
import CustomProfilePictureCircle from "./CustomProfilePictureCircle";

type props = {
  name: string
  bio?: string | undefined | null
}

export default function ProfileDetails({ name, bio }: props) {
  return (
    <CustomScrollView>
      <Spacer size="small" />
      <View style={styles.profileHeader}>
        <CustomProfilePictureCircle size={100} />
        <Spacer />
        <View style={styles.profileAside}>
          <CustomLabel fontSize={18.5} bold labelText={name} textAlign="left" adaptToTheme />
          <Spacer size="small" />
          <CustomButton labelText="View friends" squashed type="theme-faded" />
        </View>
      </View>
      <Spacer />
      <View style={styles.bio}>
        {bio && <CustomLabel width={"80%"} fontSize={15} textAlign="left" labelText={bio ?? ""} adaptToTheme />}
        {!bio && <CustomLabel width={"80%"} fontSize={15} textAlign="left" labelText={"No bio yet"} fade italic adaptToTheme />}
      </View>
    </CustomScrollView>
  )
}

const styles = StyleSheet.create({
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