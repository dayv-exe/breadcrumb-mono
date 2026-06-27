import { GetCrumbsByIds } from "@/api/db/crumbsDb";
import { Crumb } from "@/api/models/crumb";
import { calculateDistanceMeters } from "@/constants/mapFunctions";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { MapBottomSheetNavType, SheetRoute } from "@/hooks/useSheetNavigation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { convertToPreferredDistance } from "@/utils/helpers";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import { colorForUserId } from "@/utils/userColor";
import { ChevronDownIcon, LockIcon, PlayIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";

interface props {
  nav: MapBottomSheetNavType<SheetRoute>
  crumbIds: string[]
}

function CrumbPicture() {
  const size = 60
  const mode = useColorScheme()
  return (
    <View style={{
      shadowColor: "black",
      shadowOpacity: mode === "light" ? .25 : 1,
      shadowRadius: 5,
      shadowOffset: { height: 0, width: 0 },
      elevation: 5,
      borderWidth: 5,
      borderBottomWidth: 10,
      borderColor: "#fff",
      backgroundColor: "#ccc",
      height: size,
      width: size,
    }}>

    </View>
  )
}

export default function MultiCrumbsBottomSheetView({ crumbIds, nav }: props) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const textCol = useThemeColor({}, "text")
  const userCoordinates = useLocationStore(s => s.coordinates)
  const mode = useColorScheme()

  function CrumbItem({ c }: { c: Crumb }) {
    const { data: user, error: userError, isPending: userIsPending } = useGetUser(c.sent ? c.receiver : c.sender)
    const crumbCoordinates: Coordinates = { accuracy: 0, latitude: c.latitude, longitude: c.longitude }
    const distanceText = userCoordinates ? convertToPreferredDistance(calculateDistanceMeters(userCoordinates, crumbCoordinates)) + " away" : "0 yards away"
    const unlocked = calculateDistanceMeters(userCoordinates!, crumbCoordinates) < 900
    const userColor = user && user?.userId ? colorForUserId(user.userId) : textCol
    const crumbBg = mode === "light" ? "rgba(0, 0, 0, .075)" : "rgba(255, 255, 255, .075)"
    return (
      <TouchableOpacity onPress={() => {
        // nav.push("crumb")
      }} key={c.id} style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: 'flex-start',
        width: "100%",
        marginBottom: 15,
      }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "auto"
        }}>
          <CustomLabel adaptToTheme bold labelText={user?.email ? "me" : (user?.nickname ?? "")} padding={0} fontSize={15} customStyle={{
            marginLeft: -4.5,
            color: user && user.userId ? colorForUserId(user.userId) : "#000",
            flexGrow: 1,
            flexShrink: 1,
          }} />

          {/* <CustomProfilePictureCircle customStyle={{
            marginLeft: -9
          }} size={21} userId={user?.userId} /> */}
        </View>
        <Spacer size="tiny" />
        <View style={{
          flexDirection: "row",
          alignItems: 'center',
          justifyContent: "center",
        }}>
          <View style={{
            backgroundColor: user && user.userId ? colorForUserId(user.userId) : "#000",
            width: 4,
            height: "100%",
            borderRadius: 100,
            marginVertical: 33
          }} />
          <View style={{
            flexDirection: "row",
            alignItems: 'center',
            justifyContent: "center",
            backgroundColor: crumbBg,
            paddingVertical: 20,
            paddingHorizontal: 13,
            borderRadius: 7,
            marginLeft: 10,
          }}>
            {!unlocked && <>
              <LockIcon strokeWidth={3} fill={"transparent"} stroke={userColor} size={20} />
              <CustomLabel adaptToTheme bold labelText={distanceText} fontSize={17} customStyle={{
                padding: 0,
                marginLeft: 7,
              }} />
            </>}
            {unlocked && <>
              <PlayIcon strokeWidth={0} size={20} fill={userColor} />
              <CustomLabel adaptToTheme bold labelText={"Tap to view"} fontSize={17} customStyle={{
                padding: 0,
                marginLeft: 7,
              }} />
            </>}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  useEffect(() => {
    const fetchCrumbs = async () => {
      const c = await GetCrumbsByIds(crumbIds)
      setCrumbs(c)
    }

    fetchCrumbs()
  }, [crumbIds])

  return (
    <View>
      <CustomLabel adaptToTheme bold labelText="In this cluster" textAlign="center" customStyle={{
        padding: 0,
        marginTop: 5,
      }} />
      <CustomFloatingSquare isFlat type="text" customStyle={{
        position: "absolute",
        top: -5,
        right: 0,
      }}>
        <ChevronDownIcon stroke={textCol} strokeWidth={3} />
      </CustomFloatingSquare>
      <Spacer />
      {crumbs.map(c => (
        <CrumbItem key={c.id} c={c} />
      ))}
    </View>
  )
}