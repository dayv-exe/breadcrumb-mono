import { useSheetNavigation } from "@/hooks/useSheetNavigation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import { X } from "lucide-react-native";
import { useEffect } from "react";
import Animated from "react-native-reanimated";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import DroppedPinBottomSheetView from "./DroppedPinBottomSheetView";
import PoiBottomSheetView from "./PoiBottomSheetView";

type SheetRoute = "home" | "poi" | "pin" | "crumb";

export type SelectedItemType = {
  type: "poi" | "pin" | "crumb"
  displayProperties: Feature<Geometry, GeoJsonProperties> | [number, number]
}
interface props {
  selectedItem: SelectedItemType | null
  droppedPinRadius: number
  setDroppedPinRadius: (n: number) => void
  clearSelectedItem: () => void
}

export default function MapSheetContent({ selectedItem, clearSelectedItem, droppedPinRadius, setDroppedPinRadius }: props) {
  const nav = useSheetNavigation<SheetRoute>("home");
  const textCol = useThemeColor({}, "text")

  useEffect(() => {
    if (!selectedItem) {
      nav.reset("home")
    } else if (selectedItem.type === "crumb") {
      nav.reset("crumb")
    } else if (selectedItem.type === "pin") {
      nav.reset("pin")
    } else if (selectedItem.type === "poi") {
      nav.reset("poi")
    }
  }, [selectedItem, selectedItem?.type])

  return (
    <BottomSheetView style={{ width: "100%" }}>
      {nav.canGoBack && (
        <CustomFloatingSquare
          handleClick={nav.pop}
        >
          <X size={21} stroke={textCol} />
        </CustomFloatingSquare>
      )}

      <Animated.View
        key={nav.current}
        // entering={SlideInRight}
        // exiting={SlideOutLeft}
        style={{
          padding: 20,
        }}
      >
        {nav.current === "home" && (
          <>
            <CustomLabel labelText="this is home" adaptToTheme />
          </>
        )}
        {nav.current === "crumb" && (
          <>
            <CustomLabel labelText="this is a crumb" adaptToTheme />
          </>
        )}
        {nav.current === "poi" && selectedItem && selectedItem.type === "poi" && (
          <PoiBottomSheetView selectedItem={selectedItem.displayProperties as Feature<Geometry, GeoJsonProperties>} clearSelection={clearSelectedItem} />
        )}
        {nav.current === "pin" && selectedItem && selectedItem.type === "pin" && (
          <DroppedPinBottomSheetView radius={droppedPinRadius} setRadius={setDroppedPinRadius} pin={selectedItem.displayProperties as [number, number]} clearPin={clearSelectedItem} />
        )}
      </Animated.View>
    </BottomSheetView>
  );
}