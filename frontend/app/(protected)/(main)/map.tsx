import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap from "@/components/map/CustomMap";
import MapControls from "@/components/map/MapControls";
import MapFriendsView from "@/components/map/MapFriendsView";
import PlaceSearch from "@/components/map/PlaceSearch";
import CustomProfilePictureCircle from "@/components/profile/CustomProfilePictureCircle";
import Spacer from "@/components/Spacer";
import GradientView from "@/components/views/GradientView";
import { Colors } from "@/constants/Colors";
import { convertCoordinatesToNumberTuple } from "@/constants/mapFunctions";
import { useCrumb } from "@/hooks/useCrumb";
import { useMap } from "@/hooks/useMap";
import { usePlaceSearchRetrieve } from "@/hooks/usePlaceSearchRetrieve";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import BottomSheet from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ChevronDownIcon, SearchIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, useColorScheme, View } from "react-native";
import { useAnimatedReaction, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
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
  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null)
  const {
    selectedLocation,
    focusOnCrumbs,
    focusOnDroppedPin,
    focusOnPoiLabel,
    clearSelectedLocation,
    focusOnUserLocation,
    setDroppedPinRadius,
    is2dButtonVisible,
    set2dButtonVisible,
    lock2DButtonAsHidden,
    focusOnSearchResult,
    make2d,
    useSatellite,
    setUseSatellite,
  } = useMap(
    mapRef,
    mapCamRef,
    null
  )
  const { clearSearchResult, searchResult, setPlaceId } = usePlaceSearchRetrieve(sessionToken, coords => {
    clearSelectedLocation()
    focusOnSearchResult(coords)
  })

  const {
    crumbFeatures,
    crumbImages,
    setMailbox,
    mailbox,
  } = useCrumb()

  const mode = useColorScheme() ?? "light";
  const bgCol = useThemeColor({}, "background")
  const txtCol = useThemeColor({}, "text")
  const { openSheet, closeSheet, animatedPosition: globalSheetPosition } = useBottomSheet()
  const insets = useSafeAreaInsets()
  const screenHeight = Dimensions.get("window").height
  const availableHeight = screenHeight - insets.top - 5
  const [forceDark, setForceDark] = useState(false)
  const searchBgCol = useThemeColor({}, "darkBackground")
  const coordinates = useLocationStore(s => s.coordinates)
  const bottomSheetRef = useRef<BottomSheet>(null)

  const handleSearchPress = () => {
    setSessionToken(GenerateUUID())
    openSheet({
      content: (
        <PlaceSearch
          availableHeight={availableHeight}
          HandleClosePress={closeSheet}
          mapRef={mapRef}
          OnPlaceSelect={handlePlaceSelected}
          sessionToken={sessionToken}
        />
      ),
      snapPoints: [availableHeight],
      reduceAnimations: false,
      showOverlay: false,
      backgroundStyle: { backgroundColor: searchBgCol }
    })
  }

  useEffect(() => {

  }, [coordinates])

  // starts at screenHeight = sheet fully closed
  const sheetPosition = useSharedValue(screenHeight);

  const handlePlaceSelected = (id: string) => {
    closeSheet()
    setPlaceId(id)
    // focus map on place or drop pin or something
  }

  const headerOpacity = useRef(new Animated.Value(1)).current;

  const getPageName = (): string => {
    switch (mailbox) {
      case "saved":
        return "❤️ Saved"

      case "sent":
        return "Sent"

      default:
        return "Unopened"
    }
  }

  const headerShown = (visible: boolean) => {
    Animated.timing(headerOpacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };


  const CONTROLS_BOTTOM = 200;  // matches styles.mapControls.bottom
  const GAP_ABOVE_SHEET = 110;  // breathing room between controls and sheet
  const HALF_OF_PAGE = screenHeight * 0.5

  const controlsAnimatedStyle = useAnimatedStyle(() => {
    const sheetVisibleHeight = screenHeight - sheetPosition.value;
    const overlap = Math.max(0, (sheetPosition.value >= HALF_OF_PAGE ? sheetVisibleHeight : HALF_OF_PAGE) + GAP_ABOVE_SHEET - CONTROLS_BOTTOM);
    return {
      transform: [{ translateY: -overlap }],
    };
  });

  useAnimatedReaction(
    () => Math.min(sheetPosition.value, globalSheetPosition.value) < screenHeight * .2, // true = sheet is high up
    (isSheetUp, previous) => {
      console.log(globalSheetPosition.value)
      if (isSheetUp !== previous) {
        scheduleOnRN(headerShown, !isSheetUp)
      }
    }
  );

  const gradCol = mode === "dark" || forceDark ? "#000000" : "#ffffff"
  const getHeaderColors = (): { fgColor: string, bgColor: string, gradientCol: string } => {
    if (forceDark || useSatellite) return { fgColor: Colors.dark.text, bgColor: Colors.dark.background, gradientCol: "#000000" }
    else return { fgColor: txtCol, bgColor: bgCol, gradientCol: mode === "light" ? "#ffffff" : "#000000" }
  }

  const nav = useRouter()
  return (
    <View style={[styles.page, { backgroundColor: bgCol }]}>

      <Animated.View pointerEvents="box-none" style={[styles.headerWrapper, {
        top: 0,
        opacity: headerOpacity,
      }]}>
        <GradientView colors={[getHeaderColors().gradientCol + "ff", getHeaderColors().gradientCol + "00",]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.headerWrapper, {
          paddingTop: insets.top,
          paddingBottom: 20,
          top: 0,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: 'space-between',
          paddingHorizontal: 15,

        }]}>
          <CustomButton
            type="text"
            customStyle={{
              padding: 0,
              paddingHorizontal: 0,
            }}
          >
            <CustomLabel width="auto" padding={0} bold adaptToTheme labelText={getPageName()} fontSize={23} customStyle={{ color: getHeaderColors().fgColor }} />
            <Spacer size="tiny" />
            <ChevronDownIcon stroke={getHeaderColors().fgColor} strokeWidth={2.5} size={21} />
          </CustomButton>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CustomButton
              freed
              type="text"
              customStyle={[styles.shadow, {
                padding: 10,
              }]}
              handleClick={handleSearchPress}
            >
              <SearchIcon stroke={getHeaderColors().fgColor} strokeWidth={3} />
            </CustomButton>
            <CustomProfilePictureCircle size={40} handleClick={() => {
              nav.push("/(protected)/(main)/profile")
            }} />
          </View>
        </GradientView>
      </Animated.View>


      <CustomMap
        selectedLocation={selectedLocation}
        mapRef={mapRef}
        cameraRef={mapCamRef}
        zoomLevel={12.25}
        useSatellite={useSatellite}
        maxZoomLvlToDark={2.075}
        setForceDark={setForceDark}
        featureCollection={crumbFeatures}
        featureCollectionImages={crumbImages}
        searchResult={searchResult}
        onMapPress={() => {
          clearSearchResult()
        }}
        onMapLongPress={() => {
          clearSearchResult()
        }}
        allowAutoPitch
        onDroppedPin={focusOnDroppedPin}
        onPoiSelect={focusOnPoiLabel}
        is2dButtonVisible={is2dButtonVisible}
        set2dButtonVisible={set2dButtonVisible}
        lock2dButtonAsHidden={lock2DButtonAsHidden}
        setMapCenter={setMapCenter}
        onCrumbsSelect={focusOnCrumbs}
        centerCoordinate={convertCoordinatesToNumberTuple(mapCenter ?? { accuracy: 0, latitude: 0, longitude: 0 })}
      />

      <MapControls
        onFocusPress={focusOnUserLocation}
        onSatellitePress={() => setUseSatellite(!useSatellite)}
        pitchToggleVisible={is2dButtonVisible}
        onPitchToggle={make2d}
        onSearchPress={() => {
          setSessionToken(GenerateUUID())
          openSheet({
            content: (
              <PlaceSearch
                availableHeight={availableHeight}
                HandleClosePress={closeSheet}
                mapRef={mapRef}
                OnPlaceSelect={handlePlaceSelected}
                sessionToken={sessionToken}
              />
            ),
            snapPoints: [availableHeight],
            reduceAnimations: false,
            showOverlay: false,
            backgroundStyle: { backgroundColor: searchBgCol },
          })
        }}
        containerStyle={
          controlsAnimatedStyle
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        enableOverDrag
        enableContentPanningGesture
        enableHandlePanningGesture
        enableBlurKeyboardOnGesture
        animationConfigs={{
          stiffness: 500,
          damping: 20,
          mass: 0.5,
        }}
        containerStyle={{
          zIndex: 1000,
        }}
        snapPoints={["50%", ((availableHeight / screenHeight) * 100) + "%"]}
        backgroundStyle={{

          elevation: 10,
          shadowColor: "black",
          shadowOpacity: .175,
          shadowOffset: { height: 1, width: 0 },
          shadowRadius: 10,

          backgroundColor: bgCol,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        }}
        handleIndicatorStyle={{
          backgroundColor: txtCol,
          opacity: .9
        }}
        animatedPosition={sheetPosition}
      >
        <MapFriendsView bottomSheetRef={bottomSheetRef} screenHeight={screenHeight} sheetPosition={sheetPosition} />
      </BottomSheet>
    </View >
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
    width: "100%",
    position: "absolute",
    bottom: 85,
    zIndex: 100,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 10,
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

  shadow: {
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: .375,
    shadowRadius: 10,
  },
});
