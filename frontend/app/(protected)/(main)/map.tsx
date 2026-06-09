import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomFloatingSquare from "@/components/buttons/CustomFloatingSquare";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap from "@/components/map/CustomMap";
import MapSheetContent from "@/components/map/MapSheetContent";
import PlaceSearch from "@/components/map/PlaceSearch";
import Spacer from "@/components/Spacer";
import GradientView from "@/components/views/GradientView";
import { Colors } from "@/constants/Colors";
import { useCrumb } from "@/hooks/useCrumb";
import { useMap } from "@/hooks/useMap";
import { usePlaceSearchRetrieve } from "@/hooks/usePlaceSearchRetrieve";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import BottomSheet from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useRef, useState } from "react";
import { Animated, Dimensions, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as GenerateUUID } from "uuid";

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
  const [sessionToken, setSessionToken] = useState(() => GenerateUUID())
  const mapRef = useRef<Mapbox.MapView>(null);
  const mapCamRef = useRef<Mapbox.Camera>(null)
  const coordinates = useLocationStore(s => s.coordinates)
  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null)
  const {
    droppedPin,
    droppedPinRadius,
    focusOnCoords,
    focusOnDroppedPin,
    focusOnPoi,
    focusOnUserLocation,
    selectedPoi,
    setDroppedPin,
    setDroppedPinRadius,
    is2dButtonVisible,
    set2dButtonVisible,
    lock2DButtonAsHidden,
    focusOnSearchResult,
    make2d,
    setSelectedPoi,
  } = useMap(
    mapRef,
    mapCamRef
  )
  const { clearSearchResult, searchResult, setPlaceId } = usePlaceSearchRetrieve(sessionToken, coordinates, coords => {
    setDroppedPin(null)
    setSelectedPoi(null)
    focusOnSearchResult(coords)
  })

  const {
    crumbFeatures,
    crumbImages,
    fetchCrumbs,
  } = useCrumb()

  const mode = useColorScheme() ?? "light";
  const bgCol = useThemeColor({}, "background")
  const elevatedBgCol = useThemeColor({}, "fadedBackgroundElevated")
  const txtCol = useThemeColor({}, "text")
  const { openSheet, closeSheet } = useBottomSheet()
  const insets = useSafeAreaInsets()
  const screenHeight = Dimensions.get("window").height
  const availableHeight = screenHeight - insets.top
  const [pageName, setPageName] = useState("Unopened")
  const [useSat, setUseSat] = useState(false)
  const [forceDark, setForceDark] = useState(false)
  const searchBgCol = useThemeColor({}, "darkBackground")

  const handlePlaceSelected = (id: string) => {
    closeSheet()
    setPlaceId(id)
    // focus map on place or drop pin or something
  }

  const headerOpacity = useRef(new Animated.Value(1)).current;

  const fadeHeader = (visible: boolean) => {
    Animated.timing(headerOpacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const gradCol = mode === "dark" || forceDark ? "#000000" : "#ffffff"

  return (
    <View style={[styles.page, { backgroundColor: bgCol }]}>

      <Animated.View style={[styles.headerWrapper, {
        top: 0,
        opacity: headerOpacity,
      }]}>
        <GradientView colors={[gradCol + "ff", gradCol + "ee", gradCol + "dd", gradCol + "dd", gradCol + "cc", gradCol + "bb", gradCol + "aa", gradCol + "88", gradCol + "66", gradCol + "00"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.headerWrapper, {
          paddingTop: insets.top,
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
      </Animated.View>


      <CustomMap
        mapRef={mapRef}
        cameraRef={mapCamRef}
        zoomLevel={12.25}
        useSatellite={useSat}
        maxZoomLvlToDark={2.075}
        setForceDark={setForceDark}
        featureCollection={crumbFeatures}
        featureCollectionImages={crumbImages}
        searchResult={searchResult}
        onMapPress={() => {
          setDroppedPin(null)
          clearSearchResult()
        }}
        onMapLongPress={() => {
          clearSearchResult()
        }}
        allowAutoPitch
        activePoi={selectedPoi}
        dropPinCoord={droppedPin}
        onDroppedPin={focusOnDroppedPin}
        onPoiSelect={focusOnPoi}
        droppedPinRadius={droppedPinRadius}
        is2dButtonVisible={is2dButtonVisible}
        set2dButtonVisible={set2dButtonVisible}
        lock2dButtonAsHidden={lock2DButtonAsHidden}
        setMapCenter={setMapCenter}
        onMapReady={fetchCrumbs}
      />

      <View style={styles.mapControls}>
        {is2dButtonVisible && <CustomFloatingSquare type="themed" handleClick={make2d}>
          <CustomLabel adaptToTheme labelText="2D" textAlign="center" bold />
        </CustomFloatingSquare>}
        <Spacer size="small" />
        <CustomImageButton
          size={21}
          src={getIconImage("search", mode === "light")}
          handleClick={() => {
            setSessionToken(GenerateUUID())
            fadeHeader(false)
            openSheet({
              content: (
                <PlaceSearch
                  availableHeight={availableHeight}
                  HandleClosePress={closeSheet}
                  mapRef={mapRef}
                  userLocation={coordinates ?? { accuracy: 0, latitude: 0, longitude: 0 }}
                  OnPlaceSelect={handlePlaceSelected}
                  sessionToken={sessionToken}
                  mapCenter={mapCenter}
                />
              ),
              snapPoints: [availableHeight],
              reduceAnimations: false,
              onSheetDismissed: () => fadeHeader(true),
              showOverlay: false,
              backgroundStyle: { backgroundColor: searchBgCol }
            })
          }}
        />
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
        <MapSheetContent
          selectedItem={selectedPoi ? { type: "poi", displayProperties: selectedPoi } : droppedPin ? { type: "pin", displayProperties: droppedPin } : null}
          droppedPinRadius={droppedPinRadius}
          setDroppedPinRadius={setDroppedPinRadius}
          clearSelectedItem={() => {
            setDroppedPin(null)
            setSelectedPoi(null)
            setDroppedPinRadius(15)
          }}
        />
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
