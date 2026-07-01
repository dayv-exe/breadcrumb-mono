import { GetGroupedCrumbsByIds } from "@/api/db/crumbsDb";
import { Crumb } from "@/api/models/crumb";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { MapBottomSheetNavType, SheetRoute } from "@/hooks/useSheetNavigation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ChevronDownIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CrumbCluster from "../crumbs/CrumbCluster";

interface props {
  nav: MapBottomSheetNavType<SheetRoute>
  crumbIds: string[]
}

export default function MultiCrumbsBottomSheetView({ crumbIds, nav }: props) {
  const [crumbs, setCrumbs] = useState<Record<string, Crumb[]>>({})
  const textCol = useThemeColor({}, "text")
  const darkBgCol = useThemeColor({}, "darkBackground")
  const mode = useColorScheme()

  useEffect(() => {
    const fetchCrumbs = async () => {
      const c = await GetGroupedCrumbsByIds(crumbIds, true)
      setCrumbs(c)
    }
    fetchCrumbs()
  }, [crumbIds])

  return (
    <View style={{
      // backgroundColor: darkBgCol,
      // padding: 20,
      maxHeight: 350,
    }}>
      <CustomLabel adaptToTheme bold labelText="Clustered crumbs" fontSize={18} textAlign="center" customStyle={{
        padding: 0,
        marginTop: 5,
        fontWeight: "700",
      }} />
      <CustomFloatingSquare isFlat type="text" customStyle={{
        position: "absolute",
        top: -5,
        right: 20,
      }}>
        <ChevronDownIcon stroke={textCol} strokeWidth={3} />
      </CustomFloatingSquare>
      <Spacer />
      <ScrollView showsVerticalScrollIndicator={false} style={{
        width: "100%",
        paddingHorizontal: 20,
      }}>
        {Object.entries(crumbs)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([id, crumbs]) => (
            <CrumbCluster key={id} userid={id} crumbs={crumbs} />
          ))}
      </ScrollView>
    </View>
  )
}