import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap from "@/components/map/CustomMap";
import Spacer from "@/components/Spacer";
import GradientView from "@/components/views/GradientView";
import { Colors } from "@/constants/Colors";
import { getPressedLocationInfo } from "@/constants/mapFunctions";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import type { FeatureCollection } from "geojson";
import { useCallback, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const txtCol = useThemeColor({}, "text")
  const router = useRouter()
  const { openSheet, closeSheet } = useBottomSheet()
  const insets = useSafeAreaInsets()
  const screenHeight = Dimensions.get("window").height
  const availableHeight = screenHeight - insets.top
  const [pageName, setPageName] = useState("Unopened")
  const [useSat, setUseSat] = useState(false)
  const [forceDark, setForceDark] = useState(false)
  const [crumbImages, setCrumbImages] = useState<{ [key: string]: Mapbox.ImageEntry; }>({
    "user_3": require("../../../assets/images/icons/test_avatar_4.jpg"),
  })
  const [crumbFeatures, setCrumbFeatures] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: '1',
        properties: { profilePicture: 'user_1', nickname: "L", prompt: "" },
        geometry: { type: 'Point', coordinates: [-1.4119485819435904, 50.90357624958019] },
      },
      {
        type: 'Feature',
        id: '2',
        properties: { profilePicture: 'user_2', nickname: "F", prompt: "" },
        geometry: { type: 'Point', coordinates: [-1.4003734693118226, 50.90843458227937] },
      },
      {
        type: 'Feature',
        id: '3',
        properties: { profilePicture: 'user_3', nickname: "D", prompt: "" },
        geometry: { type: 'Point', coordinates: [-1.4101579464572567, 50.92902669308694] },
      },
    ],
  })

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
      onSheetDismissed: () => setPageName("Unopened")
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

    setCrumbFeatures(prev => ({
      ...prev,
      features: prev.features.map(feature =>
        feature.id === "2"
          ? {
            ...feature,
            properties: {
              ...feature.properties,
              prompt: "Tap to view"
            },
          }
          : feature
      ),
    }))
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

  const gradCol = mode === "dark" || forceDark ? "#000000" : "#ffffff"

  return (
    <View style={[styles.page, { backgroundColor: bgCol }]}>

      <GradientView colors={[gradCol + "ff", gradCol + "ee", gradCol + "dd", gradCol + "dd", gradCol + "cc", gradCol + "bb", gradCol + "aa", gradCol + "88", gradCol + "66", gradCol + "00"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.headerWrapper, {
        paddingTop: insets.top + 5,
        paddingBottom: 0,
        top: 0,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: 'flex-start',
      }]}>
        <CustomLabel bold adaptToTheme labelText={pageName} fontSize={21} customStyle={{ paddingHorizontal: 15, color: forceDark ? Colors.dark.text : txtCol }} />
        <Spacer size="small" />
        <View style={[{
          width: "100%",
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "row",
        }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 10
            }}
          >
            <CustomButton labelText="📬 Unopened" customTextStyle={{ fontWeight: "400" }} squashed type="themed" adaptToTheme handleClick={() => {
              handleShowFiltered("Unopened")
            }} customStyle={{
              shadowColor: "#000",
              shadowOffset: { height: 2, width: 2, },
              shadowOpacity: .25,
              shadowRadius: 2,
              marginBottom: 5,
              elevation: 5
            }} />
            <Spacer size="small" />
            <CustomButton labelText="🛫 Sent" customTextStyle={{ fontWeight: "400" }} squashed type="themed" adaptToTheme handleClick={() => {
              handleShowFiltered("Sent")
            }} customStyle={{
              shadowColor: "#000",
              shadowOffset: { height: 2, width: 2, },
              shadowOpacity: .25,
              shadowRadius: 2,
              marginBottom: 5,
              elevation: 5
            }} />
            <Spacer size="small" />
            <CustomButton labelText="❤️ Saved" customTextStyle={{ fontWeight: "400" }} squashed type="themed" adaptToTheme handleClick={() => {
              handleShowFiltered("❤️ Saved")
            }} customStyle={{
              shadowColor: "#000",
              shadowOffset: { height: 2, width: 2, },
              shadowOpacity: .25,
              shadowRadius: 2,
              marginBottom: 5,
              elevation: 5,
            }} />
            <Spacer size="small" />
            <CustomButton labelText="🔒 Private" customTextStyle={{ fontWeight: "400" }} squashed type="themed" adaptToTheme handleClick={() => {
              handleShowFiltered("🔒 Private")
            }} customStyle={{
              shadowColor: "#000",
              shadowOffset: { height: 2, width: 2, },
              shadowOpacity: .25,
              shadowRadius: 2,
              marginBottom: 5,
              elevation: 5
            }} />
            <Spacer size="small" />

            <CustomButton labelText="👀 Opened" customTextStyle={{ fontWeight: "400" }} squashed type="themed" adaptToTheme handleClick={() => {
              handleShowFiltered("👀 Opened")
            }} customStyle={{
              shadowColor: "#000",
              shadowOffset: { height: 2, width: 2, },
              shadowOpacity: .25,
              shadowRadius: 2,
              marginBottom: 5,
              elevation: 5
            }} />
            <Spacer size="small" />
          </ScrollView>
        </View>
      </GradientView>


      <CustomMap mapRef={mapRef} cameraRef={mapCamRef} zoomLevel={12.25} useSatellite={useSat} onMapLongPress={() => closeSheet()} onMapPress={async e => {
        const result = await getPressedLocationInfo(e, mapRef);
        // console.log(result?.features[0])
      }} maxZoomLvlToDark={2.075} setForceDark={setForceDark} featureCollection={crumbFeatures} featureCollectionImages={crumbImages} />

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

      <BottomSheet handleIndicatorStyle={{
        backgroundColor: txtCol,
      }} handleStyle={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
      }} containerStyle={{
        zIndex: 200,
        width: "100%",
      }} backgroundStyle={{
        borderRadius: 30,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { height: 0, width: 0 },
        shadowOpacity: .175,
        shadowRadius: 10,
        width: "100%",
        backgroundColor: bgCol
      }}>
        <BottomSheetScrollView>
          <View style={{
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            width: "100%",
          }}>
            <CustomButton labelText="Add friend" type="theme-faded" customStyle={{
              height: 40,
              width: 120,
              marginTop: 15,
              marginHorizontal: 15,
              padding: 0,
            }} />
          </View>
          <Spacer size="small" />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: "absolute",
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "row",
    zIndex: 10,
    width: "100%",
  },
  headerText: {
    fontSize: 16
  },
  mapControls: {
    position: "absolute",
    bottom: 85,
    right: 10,
    zIndex: 100
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

  searchBar: {
    opacity: .8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: .3,
    shadowRadius: 5,
  },
});
