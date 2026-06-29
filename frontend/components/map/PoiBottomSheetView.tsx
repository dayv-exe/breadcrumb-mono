import { convertNumberTupleToCoordinates, distanceMeters, getEmojiForFeature, getPlaceType } from "@/constants/mapFunctions";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useThemeColor } from "@/hooks/useThemeColor";
import { convertToPreferredDistance } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import { Camera, ChevronDownIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useShallow } from "zustand/shallow";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  selectedItem: Feature<Geometry, GeoJsonProperties>
  clearSelection: () => void
}

export default function PoiBottomSheetView({ selectedItem, clearSelection }: props) {
  const { coordinates } = useLocationStore(useShallow(s => ({
    coordinates: s.coordinates,
  })))
  const textCol = useThemeColor({}, "text")
  const darkBgCol = useThemeColor({}, "darkBackground")
  const [distance, setDistance] = useState(0)
  const { address, setReverseGeocodeCoordinates } = useReverseGeocode()
  useEffect(() => {
    const resolveAddress = async () => {
      const poiCoords = (selectedItem.geometry as any).coordinates as [number, number]
      setReverseGeocodeCoordinates(convertNumberTupleToCoordinates(poiCoords))
      setDistance(distanceMeters(coordinates?.latitude ?? 0, coordinates?.longitude ?? 0, poiCoords[1], poiCoords[0]))
    }
    resolveAddress()
  }, [selectedItem.geometry])
  return (
    <View style={{
      flexDirection: "column"
    }}>
      <View style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          flexGrow: 1,
          flexShrink: 1,
        }}>
          <View style={{
            alignItems: "flex-start",
            justifyContent: "flex-start",
          }}>
            <CustomLabel
              labelText={
                getEmojiForFeature(selectedItem)
              }
              fontSize={42}
              adaptToTheme customStyle={{ padding: 0, width: "auto" }} />
          </View>
          <View style={{
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            flexGrow: 1,
            flexShrink: 1,
            marginHorizontal: 5
          }}>
            <CustomLabel adaptToTheme labelText={selectedItem.properties?.name} bold fontSize={17} customStyle={{ padding: 0, marginBottom: 2 }} />

            <CustomLabel adaptToTheme labelText={`${getPlaceType(selectedItem.properties)}`} customStyle={{ padding: 0 }} width={"auto"} fontSize={14} />
            <CustomLabel adaptToTheme labelText={`${convertToPreferredDistance(distance)} ${address ? "• " + address : ""}`} allowTruncate fade customStyle={{ padding: 0 }} fontSize={13} />
          </View>
        </View>
        <CustomFloatingSquare type="text" isFlat customStyle={{ borderRadius: 1000, height: 35, width: 35 }} handleClick={clearSelection}>
          <ChevronDownIcon size={23} stroke={textCol} strokeWidth={3} />
        </CustomFloatingSquare>
      </View>
      <Spacer size="small" />
      <TouchableOpacity style={{
        backgroundColor: darkBgCol,
        alignSelf: "center",
        padding: 15,
        borderRadius: 1000,
      }}>
        <Camera size={35} stroke={textCol} strokeWidth={2} opacity={.9} />
      </TouchableOpacity>
    </View>
  )
}