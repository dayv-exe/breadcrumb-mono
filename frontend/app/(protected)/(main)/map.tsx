import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap from "@/components/map/CustomMap";
import Spacer from "@/components/Spacer";
import { Colors } from "@/constants/Colors";
import { getPressedLocationInfo } from "@/constants/mapFunctions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  },
  satellite: {
    light: require("../../../assets/images/icons/satellite_sel_light.png"),
    dark: require("../../../assets/images/icons/satellite_sel_dark.png")
  },
  search: {
    light: require("../../../assets/images/icons/search_unsel_light.png"),
    dark: require("../../../assets/images/icons/search_unsel_dark.png")
  },
  addCrumb: {
    light: require("../../../assets/images/icons/add_sel_light.png"),
    dark: require("../../../assets/images/icons/add_sel_dark.png")
  },
  wall: {
    light: require("../../../assets/images/icons/walls_sel_light.png"),
    dark: require("../../../assets/images/icons/walls_sel_dark.png")
  },
  close: {
    light: require("../../../assets/images/icons/close_unsel_light.png"),
    dark: require("../../../assets/images/icons/close_unsel_dark.png")
  },
  favorite: {
    light: require("../../../assets/images/icons/favorite_unsel_light.png"),
    dark: require("../../../assets/images/icons/favorite_unsel_dark.png")
  }
}

export function getIconImage(name: keyof typeof icons, darkMode: boolean) {
  const theme = darkMode ? "dark" : "light"
  return icons[name][theme]
}

export default function MapScreen() {
  const mode = useColorScheme() ?? "light";
  const mapRef = useRef<Mapbox.MapView>(null);
  const mapCamRef = useRef<Mapbox.Camera>(null)
  const bgCol = useThemeColor({}, "background")
  const router = useRouter()
  const { coordinates } = useLocationStore()
  const [selPlace, setSelPlace] = useState<{ name?: string, type?: string } | null>(null)
  const { openSheet, closeSheet } = useBottomSheet()
  const insets = useSafeAreaInsets()
  const screenHeight = Dimensions.get("window").height
  const availableHeight = screenHeight - insets.top
  const [pageName, setPageName] = useState("map")
  const [search, setSearch] = useState("")
  const searchRef = useRef(null)
  const [useSat, setUseSat] = useState(false)

  function handleShowFiltered(name: string) {
    setPageName(name)
    openSheet({
      content: (
        <>
        </>
      ),
      showOverlay: false,
      snapPoints: ["25%", availableHeight],
      fullExpansionOnOpen: false,
      reduceAnimations: true,
      onSheetDismissed: () => setPageName("map")
    })
  }

  async function focusOnUserLocation() {
    const curCoord = useLocationStore.getState().coordinates
    mapCamRef?.current?.setCamera({
      centerCoordinate: [curCoord?.longitude ?? 0, curCoord?.latitude ?? 0],
      zoomLevel: 12.5,
      animationDuration: 1000,
      pitch: 0,
      heading: 0,
    })
  }

  async function getMapCenter() {
    try {
      const center = await mapRef?.current?.getCenter();
      const zoom = await mapRef?.current?.getZoom()
      if (!center || !zoom) return null
      return { position: center, zoomLevel: zoom };
    } catch (error) {
      console.error("Error getting map center:", error);
      return null;
    }
  }

  useFocusEffect(
    useCallback(() => {
      return () => {
        closeSheet();
      };
    }, [closeSheet])
  );


  function handleAddFriend() {
    router.push("/find-friends")
  }

  return (
    <View style={[styles.page, { backgroundColor: bgCol }]}>

      <SafeAreaView pointerEvents="box-none" style={[styles.headerWrapper]}>
        <View style={[styles.headerTextContainer, { backgroundColor: mode === "dark" ? Colors.dark.background : Colors.light.background }]}>
          <CustomLabel bold adaptToTheme fade labelText={pageName} />
        </View>
      </SafeAreaView>

      <CustomMap mapRef={mapRef} cameraRef={mapCamRef} zoomLevel={12.25} useSatellite={useSat} handleCancelPress={() => closeSheet()} handlePress={async e => {
        const result = await getPressedLocationInfo(e, mapRef);
      }} />

      <View>
        <View style={[styles.bottomSheet, {
          backgroundColor: bgCol,
          position: "absolute",
          bottom: 0,
          width: "100%",
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "row",
          paddingTop: 17,
          paddingBottom: 15,
        }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20
            }}
          >
            <CustomButton labelText="📬 Crumbs" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("crumbs")
            }} />
            <Spacer size="small" />
            <CustomButton labelText="🧱 Walls" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("walls")
            }} />
            <Spacer size="small" />
            <CustomButton labelText="❤️ favorites" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("❤️ favorites")
            }} />
            <Spacer size="small" />
            <CustomButton labelText="🔒 Private" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("🔒 private")
            }} />
            <Spacer size="small" />
          </ScrollView>
        </View>
      </View>

      <View style={styles.mapControls}>
        <CustomImageButton size={21} src={getIconImage("search", mode === "light")} />
        <Spacer size="small" />
        <CustomImageButton size={23} src={getIconImage("satellite", mode === "light")} handleClick={() => setUseSat(s => !s)} />
        <Spacer size="small" />
        <CustomImageButton size={21} handleClick={() => {
          focusOnUserLocation()
        }} src={getIconImage("focusUserLoc", mode === "light")} />
        <Spacer size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    flex: 1,
    position: "absolute",
    marginTop: 10,
    top: 0,
    left: 15,
    right: 15,
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "row",
    zIndex: 10,
  },
  headerText: {
    fontSize: 16
  },
  mapControls: {
    position: "absolute",
    bottom: 70,
    right: 10,
  },
  headerTextContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 10,
    zIndex: 10
  },
  page: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowRadius: 7,
    shadowOpacity: .1,
    elevation: 4,
  },
  searchBar: {
    opacity: .8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 5,
  },
});
