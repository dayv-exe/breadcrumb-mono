import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap, { mapMethods } from "@/components/map/CustomMap";
import Skeleton from "@/components/skeletons/Skeleton";
import Spacer from "@/components/Spacer";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { getMostRelevantPOI, queryPOIAtScreenCoordinate } from "@/utils/screenPointToPoi";
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
        <View>
          <CustomImageButton src={getIconImage("addFriend", mode === "light")} handleClick={handleAddFriend} />
          <Spacer size="small" />
        </View>
        <View style={[styles.headerTextContainer, { backgroundColor: mode === "dark" ? Colors.dark.background : Colors.light.background }]}>
          <CustomLabel bold adaptToTheme fade labelText={pageName} />
        </View>
        <View>
          <CustomImageButton src={getIconImage("search", mode === "light")} />
          <Spacer size="small" />
          <CustomImageButton src={getIconImage("frameMap", mode === "light")} />
          <Spacer size="small" />
          <CustomImageButton handleClick={() => {
            focusOnUserLocation()
          }} src={getIconImage("focusUserLoc", mode === "light")} />
          <Spacer size="small" />
        </View>
      </SafeAreaView>

      <CustomMap setMapMethods={setMapMethods} mapRef={mapRef} zoomLevel={12.5} useSatellite={false} handleCancelPress={() => closeSheet()} handleLongPress={async e => {
        if (1 + 1 === 2) {
          return
        }
        openSheet({
          content: (
            <>
              {!selPlace &&
                <View style={{ height: 200, paddingHorizontal: 20, flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Skeleton width={75} height={75} borderRadius="100%" />
                    <Spacer size="small" />
                    <View>
                      <Skeleton width={200} height={21} borderRadius={25} />
                      <Spacer size="small" />
                      <Skeleton width={150} height={21} borderRadius={25} />
                    </View>
                  </View>
                </View>
              }
              {selPlace &&
                <View style={{ height: 200, paddingHorizontal: 20, flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Skeleton width={75} height={75} borderRadius="100%" />
                    <Spacer size="small" />
                    <View>
                      <CustomLabel adaptToTheme labelText={selPlace.name} />
                      <Spacer size="small" />
                      <CustomLabel adaptToTheme labelText={selPlace.type} />
                    </View>
                  </View>
                </View>
              }
            </>
          ),
          showOverlay: false,
          dynamicHeight: true,
        })

        const result = await queryPOIAtScreenCoordinate(mapRef, e.x, e.y);
        console.log(result)
        if (result.features.length > 0) {
          const poi = getMostRelevantPOI(result.features);
          setSelPlace({ name: poi?.properties.name, type: poi?.properties.type })
        } else {
          console.log('No POI found at this location');
          console.log('Geographic coordinates:', result.geoCoordinates);
        }
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
            <CustomButton labelText="📬 Unopened" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("unopened")
            }} />
            <Spacer size="small" />
            <CustomButton labelText="🧱 Walls" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("walls")
            }} />
            <Spacer size="small" />
            <CustomButton labelText="📍Nearby" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("nearby")
              focusOnUserLocation()
            }} />
            <Spacer size="small" />
            <CustomButton labelText="🔒 Private" customTextStyle={{ fontWeight: "400" }} squashed type="theme-faded" handleClick={() => {
              handleShowFiltered("🔒 private")
            }} />
            <Spacer size="small" />
          </ScrollView>
        </View>
      </View>
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
  }
});
