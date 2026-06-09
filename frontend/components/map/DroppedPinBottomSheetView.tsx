import { distanceMeters } from "@/constants/mapFunctions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useShallow } from "zustand/shallow";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CustomButton from "../buttons/CustomButton";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";

interface props {
  pin: [number, number]
}

export default function DroppedPinBottomSheetView({ pin }: props) {
  const { coordinates, reverseGeocode } = useLocationStore(useShallow(s => ({
    coordinates: s.coordinates,
    reverseGeocode: s.reverseGeocode,
  })))
  const textCol = useThemeColor({}, "text")
  const [address, setAddress] = useState<string | null>("")
  const [distance, setDistance] = useState(0)
  useEffect(() => {
    const resolveAddress = async () => {
      const addressProm = await reverseGeocode({ latitude: pin[1] ?? 0, longitude: pin[0] ?? 0, accuracy: 0 })
      setAddress(addressProm)
      setDistance(distanceMeters(coordinates?.latitude ?? 0, coordinates?.longitude ?? 0, pin[1], pin[0]))
    }
    resolveAddress()
  }, [pin])
  return (
    <View style={{
      flexDirection: "column"
    }}>
      <View style={{
        width: "100%",
        flexDirection: "row",
      }}>
        <CustomLabel
          labelText="📌"
          fontSize={42}
          adaptToTheme customStyle={{ padding: 0 }} />
        <CustomFloatingSquare type="theme-faded" isFlat customStyle={{ borderRadius: 1000, padding: 0 }}>
          <X size={21} stroke={textCol} />
        </CustomFloatingSquare>
      </View>
      <Spacer size="small" />
      <CustomLabel adaptToTheme labelText="Dropped pin" bold fontSize={19} customStyle={{ padding: 0 }} />
      <Spacer size="tiny" />
      <CustomLabel adaptToTheme allowTruncate labelText={`${Math.round(distance / 1000)} mi ${address ? "• " + address : ""}`} fade customStyle={{ padding: 0 }} fontSize={15} />
      <Spacer />
      <CustomButton type="less-prominent" labelText="New Crumb" />
    </View>
  )
}