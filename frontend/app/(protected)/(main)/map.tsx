import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomSearchInput from "@/components/inputs/CustomSearchInput";
import CustomMap, { mapMethods } from "@/components/map/CustomMap";
import Spacer from "@/components/Spacer";
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
  search: {
    light: require("../../../assets/images/icons/thicksearch_unsel_light.png"),
    dark: require("../../../assets/images/icons/thicksearch_unsel_dark.png")
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
  const bgCol = useThemeColor({}, "background")
  const [mapMethods, setMapMethods] = useState<mapMethods | null>(null)
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

  function focusOnUserLocation() {
    const curCoord = useLocationStore.getState().coordinates
    mapMethods?.moveTo([curCoord?.longitude ?? 0, curCoord?.latitude ?? 0], 13)
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
        <CustomSearchInput value={search} handleChange={setSearch} ref={searchRef} solidAppearance placeholder="Search map..." customStyle={styles.searchBar} />
      </SafeAreaView>

      <CustomMap setMapMethods={setMapMethods} mapRef={mapRef} zoomLevel={12.5} useSatellite={false} handleCancelPress={() => closeSheet()} handlePress={async e => {
        const result = await getPressedLocationInfo(e, mapRef);
        console.log(result)
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
        <CustomImageButton src={getIconImage("search", mode === "light")} />
        <Spacer size="small" />
        <CustomImageButton src={getIconImage("frameMap", mode === "light")} />
        <Spacer size="small" />
        <CustomImageButton handleClick={() => {
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
    justifyContent: "space-between",
    flexDirection: "row",
    zIndex: 10,
  },
  headerText: {
    fontSize: 16
  },
  mapControls:{
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .275,
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
  searchBar:{
    opacity: .8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 5,
  },
});
