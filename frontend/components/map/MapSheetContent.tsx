import { SelectedLocation } from "@/api/models/locationTypes";
import { convertCoordinatesToNumberTuple } from "@/constants/mapFunctions";
import { useSheetNavigation } from "@/hooks/useSheetNavigation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { useEffect } from "react";
import Animated from "react-native-reanimated";
import CustomFloatingSquare from "../buttons/CustomFloatingSquare";
import CustomLabel from "../CustomLabel";
import DroppedPinBottomSheetView from "./DroppedPinBottomSheetView";
import PoiBottomSheetView from "./PoiBottomSheetView";

type SheetRoute = "home" | "poi" | "pin" | "crumb";

interface props {
  selectedLocation: SelectedLocation | null
  setRadius: (r: number) => void
  clearSelectedItem: () => void
}

export default function MapSheetContent({ selectedLocation, clearSelectedItem, setRadius }: props) {
  const nav = useSheetNavigation<SheetRoute>("home");
  const textCol = useThemeColor({}, "text")

  useEffect(() => {
    if (!selectedLocation) {
      nav.reset("home")
    } else if (selectedLocation.type === "pin") {
      nav.reset("pin")
    } else if (selectedLocation.type === "poi") {
      nav.reset("poi")
    }
  }, [selectedLocation, selectedLocation?.type])

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
          paddingTop: 25,
          paddingBottom: 10,
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
        {nav.current === "poi" && selectedLocation && selectedLocation.type === "poi" && (
          <PoiBottomSheetView selectedItem={selectedLocation.poi} clearSelection={clearSelectedItem} />
        )}
        {nav.current === "pin" && selectedLocation && selectedLocation.type === "pin" && (
          <DroppedPinBottomSheetView radius={selectedLocation.radius} setRadius={setRadius} pin={convertCoordinatesToNumberTuple(selectedLocation.coordinates)} clearPin={clearSelectedItem} />
        )}
      </Animated.View>
    </BottomSheetView>
  );
}