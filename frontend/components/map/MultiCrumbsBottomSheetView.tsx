import { GetCrumbsByIds } from "@/api/db/crumbsDb";
import { Crumb } from "@/api/models/crumb";
import { calculateDistanceMeters } from "@/constants/mapFunctions";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { MapBottomSheetNavType, SheetRoute } from "@/hooks/useSheetNavigation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { convertToPreferredDistance } from "@/utils/helpers";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import { ChevronDownIcon } from "lucide-react-native";
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

  function CrumbItem({ c }: { c: Crumb }) {
    const { data: user, error: userError, isPending: userIsPending } = useGetUser(c.sent ? c.receiver : c.sender)
    const crumbCoordinates: Coordinates = { accuracy: 0, latitude: c.latitude, longitude: c.longitude }
    return (
      <TouchableOpacity onPress={() => {
        nav.push("crumb")
      }} key={c.id} style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'flex-start',
        marginBottom: 15,
        width: "100%",
      }}>
        <CrumbPicture />
        <View style={{
          flexDirection: 'row',
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexGrow: 1,
          flexShrink: 1,
        }}>
          <View style={{
            flexDirection: 'column',
            alignItems: "flex-start",
            justifyContent: "center",
            marginLeft: 12,
          }}>
            <CustomLabel adaptToTheme fade labelText={c.sent ? "To:" : "From:"} fontSize={12} customStyle={{
              padding: 0,
              width: "auto",
            }} />
            <CustomLabel adaptToTheme labelText={user?.nickname ?? "User"} fontSize={16.5} customStyle={{
              padding: 0,
              width: "auto",
            }} />
            {userCoordinates && <CustomLabel fade adaptToTheme labelText={convertToPreferredDistance(calculateDistanceMeters(userCoordinates, crumbCoordinates)) + " away"} fontSize={12} customStyle={{
              width: "auto",
              padding: 0,
              marginTop: 3,
            }} />}
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
      <CustomLabel adaptToTheme bold labelText="Crumbs" textAlign="center" customStyle={{
        padding: 0,
      }} />
      <CustomFloatingSquare isFlat type="text" customStyle={{
        position: "absolute",
        top: -10,
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