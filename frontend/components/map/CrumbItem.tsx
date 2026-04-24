import { Crumb } from "@/api/crumbsApi";
import { Colors } from "@/constants/Colors";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import Mapbox from "@rnmapbox/maps";
import { StyleSheet, TouchableOpacity } from "react-native";
import CustomLabel from "../CustomLabel";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";

interface props {
  crumb: Crumb
  sentCrumb: boolean
  usingSatellite: boolean
}

const getDisplayName = (nickname: string, name: string): string => {
  return nickname ?? name ?? "<no name>"
}

export default function CrumbItem({ crumb, sentCrumb, usingSatellite }: props) {
  const bgCol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")
  const { data, isError } = useGetUser(sentCrumb ? crumb.receiver : crumb.sender)
  const darkGold = "#EFBF04"
  const lightGold = "#FFE866"
  const getGold = () => mode === "dark" ? darkGold : lightGold
  const user = data?.message
  const mode = useColorScheme()
  const isViewable = false 

  return (
    <Mapbox.MarkerView
      key={crumb.id ?? `${crumb.lat}-${crumb.lon}`}
      id={crumb.id ?? `${crumb.lat}-${crumb.lon}`}
      coordinate={[crumb.lon, crumb.lat]}
    //anchor={{x: .5, y: 1}}
    >
      <TouchableOpacity style={[styles.crumbMarker, {
        shadowOpacity: mode === "dark" || usingSatellite ? 1 : .4,
      }]}>
        {/* <Image source={{uri: "https://wallpapercave.com/wp/wp3996081.jpg"}} style={{
          aspectRatio: 9/16,
          width: 50,
          height: "auto",
          borderColor: bgCol,
          borderWidth: 2,
          borderRadius: 7
        }} /> */}
        <CustomProfilePictureCircle borderRadius={7} size={55} nickname={getDisplayName(user?.nickname ?? "", user?.name ?? "")} userId={user?.userId ?? ""} customStyle={{
          borderColor: isViewable ? getGold() : Colors.light.background,
          borderWidth: 4,
          backgroundColor: Colors.light.fadedBackground,
        }} customTextStyle={{
          fontWeight: 500,
          color: Colors.light.text
        }} />
        {isViewable && user && <CustomLabel adaptToTheme textAlign="center" labelText={isViewable ? "tap to view" : getDisplayName(user.nickname ?? "", user.name ?? "")} customStyle={{
          width: "auto",
          borderRadius: 8,
          paddingVertical: 3,
          paddingHorizontal: 5,
          marginTop: true ? 5 : 0,
          backgroundColor: isViewable ? getGold() : bgCol,
          color: isViewable ? "#000" : textCol,
        }} fontSize={10} bold />}
      </TouchableOpacity>
    </Mapbox.MarkerView>
  )
}

const styles = StyleSheet.create({
  crumbMarker: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    zIndex: 10
  },
})