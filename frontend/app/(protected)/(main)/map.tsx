import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap, { mapMethods } from "@/components/map/CustomMap";
import Spacer from "@/components/Spacer";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const token = Constants.expoConfig?.extra?.mapboxToken;
if (!token) {
  console.warn("Mapbox token is missing!");
} else {
  Mapbox.setAccessToken(token);
}

const icons = {
  addFriend: {
    light: require("../../../assets/images/icons/searchfriends_sel_light.png"),
    dark: require("../../../assets/images/icons/searchfriends_sel_dark.png")
  },
  frameMap: {
    light: require("../../../assets/images/icons/frame_unsel_light.png"),
    dark: require("../../../assets/images/icons/frame_unsel_dark.png")
  },
  focusUserLoc: {
    light: require("../../../assets/images/icons/userlocation_sel_light.png"),
    dark: require("../../../assets/images/icons/userlocation_sel_dark.png")
  },
  mapToggle: {
    light: require("../../../assets/images/icons/maptoggle_sel_light.png"),
    dark: require("../../../assets/images/icons/maptoggle_sel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function MapScreen() {
  const mode = useColorScheme() ?? "light";
  const theme = useThemeColor
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['7%', '15', '25%', '35%', '80%'], []);
  const mapRef = useRef<Mapbox.MapView>(null);
  const [mapMethods, setMapMethods] = useState<mapMethods | null>(null)
  const [useSatellite, setUseSatellite] = useState(false)
  const isFocused = useIsFocused()
  const router = useRouter()

  function handleAddFriend() {
    router.push("/find-friends")
  }


  return (
    <View style={[styles.page, { backgroundColor: theme({}, "background") }]}>

      <SafeAreaView style={[styles.headerWrapper]}>
        <View>
          <CustomImageButton src={getIconImage("addFriend", mode === "light")} handleClick={handleAddFriend} />
        </View>
        <View style={[styles.headerTextContainer, { backgroundColor: mode === "dark" ? Colors.dark.background : Colors.light.background }]}>
          <Text style={[styles.headerText, { color: mode === "dark" ? Colors.dark.text : Colors.light.text }]}>0 crumbs</Text>
        </View>
        <View>
          <CustomImageButton handleClick={() => {
            mapMethods?.moveTo([-1.5, 50.7], 10)
          }} src={getIconImage("focusUserLoc", mode === "light")} />
          <Spacer size="small" />
          <CustomImageButton src={getIconImage("frameMap", mode === "light")} />
          <Spacer size="small" />

        </View>
      </SafeAreaView>

      {(true || isFocused) && <CustomMap setMapMethods={setMapMethods} mapRef={mapRef} zoomLevel={12.5} useSatellite={useSatellite} />}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        containerStyle={{ zIndex: 20 }}
        backgroundStyle={[styles.bottomSheet, {
          backgroundColor: mode === "dark" ? Colors.dark.background : Colors.light.background,
        }]}
        handleIndicatorStyle={{ backgroundColor: mode === "dark" ? Colors.dark.text : Colors.light.text }}
      >
        <BottomSheetView style={{ paddingHorizontal: 30, paddingVertical: 10 }}>
          <CustomLabel labelText="crumbs" adaptToTheme />
          <CustomLabel labelText="crumbs you received or sent will show here" adaptToTheme fade />
          <Spacer size="big" />
          <CustomLabel labelText="walls" adaptToTheme />
          <CustomLabel labelText="walls you are part of will show here" adaptToTheme fade />
          <Spacer />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: "absolute",
    marginTop: 10,
    top: 0,
    left: 15,
    right: 15,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexDirection: "row",
    zIndex: 10,
  },
  headerText: {
    fontSize: 16
  },
  headerTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .275,
    shadowRadius: 10,
    zIndex: 10
  },
  page: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowRadius: 10,
    shadowOpacity: .25,
    elevation: 5,
  }
});
