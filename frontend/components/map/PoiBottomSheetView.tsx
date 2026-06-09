import { distanceMeters, getEmojiForFeature } from "@/constants/mapFunctions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useShallow } from "zustand/shallow";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  selectedItem: Feature<Geometry, GeoJsonProperties>
}
export default function PoiBottomSheetView({ selectedItem }: props) {
  const { coordinates, reverseGeocode } = useLocationStore(useShallow(s => ({
    coordinates: s.coordinates,
    reverseGeocode: s.reverseGeocode,
  })))
  const textCol = useThemeColor({}, "text")
  const [address, setAddress] = useState<string | null>("")
  const [distance, setDistance] = useState(0)
  useEffect(() => {
    const resolveAddress = async () => {
      const poiCoords = (selectedItem.geometry as any).coordinates as [number, number]
      const addressProm = await reverseGeocode({ latitude: poiCoords[1] ?? 0, longitude: poiCoords[0] ?? 0, accuracy: 0 })
      setAddress(addressProm)
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
      }}>
        <CustomLabel
          labelText={
            getEmojiForFeature(selectedItem)
          }
          fontSize={42}
          adaptToTheme customStyle={{ padding: 0 }} />
        <CustomFloatingSquare type="theme-faded" isFlat customStyle={{ borderRadius: 1000, padding: 0 }}>
          <X size={21} stroke={textCol} />
        </CustomFloatingSquare>
      </View>
      <Spacer size="small" />
      <CustomLabel adaptToTheme labelText={selectedItem.properties?.name} bold fontSize={19} customStyle={{ padding: 0 }} />
      <Spacer size="tiny" />
      <CustomLabel adaptToTheme allowTruncate labelText={`${selectedItem.properties?.type}`} customStyle={{ padding: 0 }} width={"auto"} fontSize={16} />
      <Spacer size="tiny" />
      <CustomLabel adaptToTheme allowTruncate labelText={`${Math.round(distance / 1000)} mi ${address ? "• " + address : ""}`} fade customStyle={{ padding: 0 }} fontSize={15} />
      <Spacer />
      <CustomButton type="less-prominent" labelText="New Crumb" />
    </View>
  )
}