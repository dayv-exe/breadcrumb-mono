import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import Spacer from "@/components/Spacer";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container]}>
      <View style={{ paddingTop: insets.top, paddingBottom: 15, backgroundColor: "white", width: "100%", marginBottom: 15, }}>
        <CustomLabel labelText="Notifications" bold adaptToTheme textAlign="center" />
      </View>
      <View style={{paddingHorizontal: 15}}>
        <View style={styles.elevatedView}>
          <CustomLabel labelText="Send requests"adaptToTheme bold textAlign="left" />
          <View style={[styles.card]}>
            <CustomProfilePictureCircle size={45} nickname={"s"} />
            <Spacer size="small" />
            <View style={{ flexGrow: 1 }}>
              <CustomLabel allowTruncate adaptToTheme customStyle={{ padding: 0, marginBottom: 2.5 }} labelText="Sparkling" />
              <CustomLabel allowTruncate adaptToTheme fontSize={14} customStyle={{ padding: 0 }} fade labelText="j hus" />
            </View>
            <CustomButton useMinWidth type="less-prominent" labelText="Send" customStyle={{ padding: 10 }} customTextStyle={{ padding: 0, fontSize: 14 }} />
          </View>
          <View style={styles.card}>
            <CustomProfilePictureCircle size={45} nickname={"david.arubuike"} />
            <Spacer size="small" />
            <View style={{ flexGrow: 1 }}>
              <CustomLabel allowTruncate adaptToTheme customStyle={{ padding: 0, marginBottom: 0 }} labelText="david.arubuike" />
              <CustomLabel allowTruncate adaptToTheme fontSize={14} customStyle={{ padding: 0 }} fade labelText="David" />
            </View>
            <CustomButton useMinWidth type="less-prominent" labelText="Send" customStyle={{ padding: 10 }} customTextStyle={{ padding: 0, fontSize: 14 }} />
          </View>
        </View>
        <View style={styles.elevatedView}>
          <CustomLabel labelText="Send requests" adaptToTheme bold />
          <View style={[styles.card, {
            borderTopColor: "transparent"
          }]}>
            <CustomProfilePictureCircle size={45} nickname={"s"} />
            <Spacer size="small" />
            <View style={{ flexGrow: 1 }}>
              <CustomLabel allowTruncate adaptToTheme customStyle={{ padding: 0, marginBottom: 2.5 }} labelText="Sparkling" />
              <CustomLabel allowTruncate adaptToTheme fontSize={14} customStyle={{ padding: 0 }} fade labelText="j hus" />
            </View>
            <CustomButton useMinWidth type="less-prominent" labelText="Send" customStyle={{ padding: 10 }} customTextStyle={{ padding: 0, fontSize: 14 }} />
          </View>
          <View style={styles.card}>
            <CustomProfilePictureCircle size={45} nickname={"david.arubuike"} />
            <Spacer size="small" />
            <View style={{ flexGrow: 1 }}>
              <CustomLabel allowTruncate adaptToTheme customStyle={{ padding: 0, marginBottom: 0 }} labelText="david.arubuike" />
              <CustomLabel allowTruncate adaptToTheme fontSize={14} customStyle={{ padding: 0 }} fade labelText="David" />
            </View>
            <CustomButton useMinWidth type="less-prominent" labelText="Send" customStyle={{ padding: 10 }} customTextStyle={{ padding: 0, fontSize: 14 }} />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#181818",
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "column"
  },
  elevatedView: {
    width: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    // backgroundColor: "#242424",
    backgroundColor: "#fff",
    borderRadius: 20,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 5,

    // Android shadow
    elevation: 8,
    padding: 15,
    marginBottom: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 10,
  },
})