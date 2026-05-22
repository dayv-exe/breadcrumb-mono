import { getLatestCrumbs } from "@/api/crumbsApi";
import { GetAllCrumbs, GetLastReceivedCrumbDetails } from "@/api/db/crumbsDb";
import { useBottomSheet } from "@/components/bottomsheet/BottomSheetContext";
import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import CustomLabel from "@/components/CustomLabel";
import CustomMap from "@/components/map/CustomMap";
import PlaceSearch from "@/components/map/PlaceSearch";
import Spacer from "@/components/Spacer";
import GradientView from "@/components/views/GradientView";
import { Colors } from "@/constants/Colors";
import { getMapCamPosition, MapCamPosition } from "@/constants/mapFunctions";
import { usePlaceSearchResult } from "@/hooks/usePlaceSearchResult";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLocationStore } from "@/utils/useLocationStore";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, Point } from "geojson";
import { useCallback, useRef, useState } from "react";
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
  // map poi click states
  const preLocationSelectCamPos = useRef<Promise<MapCamPosition | null>>(null)
  const resetZoomOnUnselect = useRef(false)
  const allowAutoPitch = true

  const { coordinates } = useLocationStore()

  const setCameraFn = (config: Mapbox.CameraStop) => {
    if (!mapCamRef?.current) return
    if (!allowAutoPitch) config.pitch = undefined
    mapCamRef.current.setCamera(config)
  }

  const focusOnCoords = async (coords: [number, number], preLocationSelCamPos: MapCamPosition | null, maintainPitch?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCameraFn({
      centerCoordinate: coords,
      animationDuration: 400,
      animationMode: "easeTo",
      pitch: maintainPitch ? undefined : 45,
      zoomLevel: Math.max(17, preLocationSelCamPos?.zoom ?? 0)
    })
  }

  const handleSavePreLocationSelectCameraPosition = (): Promise<MapCamPosition | null> => {
    const camPos = getMapCamPosition(mapRef)
    if (!selPoi && !droppedPin) {
      // zoom before location selection
      resetZoomOnUnselect.current = true
      preLocationSelectCamPos.current = camPos
    }
    return camPos
  }

  const { clearSearchResult, searchResult, sessionToken, setPlaceId, setSessionToken } = usePlaceSearchResult(coordinates, coords => {
    setSelPoi(null)
    setDroppedPin(null)
    focusOnCoords(coords, null, true)
  })

  const focusOnPoi = async (poi: Feature<Geometry, GeoJsonProperties> | null) => {
    setDroppedPin(null)
    clearSearchResult()
    setSelPoi(poi)
    if (poi) {
      const camPos = handleSavePreLocationSelectCameraPosition()
      focusOnCoords((poi.geometry as any).coordinates as [number, number], (await camPos))
      return;
    }

    if (resetZoomOnUnselect.current) {
      // setCameraFn({
      //   pitch: 0,
      //   zoomLevel: (await preLocationSelectCamPos.current)?.zoom ?? undefined,
      //   animationDuration: 300,
      // })
    }
  }

  const focusOnDroppedPin = async (coords: [number, number]) => {
    const camPos = handleSavePreLocationSelectCameraPosition()
    focusOnCoords(coords, await camPos)
    setDroppedPin(coords)
    setSelPoi(null)
    clearSearchResult()
  }

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
  const [droppedPin, setDroppedPin] = useState<[number, number] | null>(null)
  const [droppedPinRadius, setDroppedPinRadius] = useState<number>(15)
  const [crumbImages, setCrumbImages] = useState<{ [key: string]: Mapbox.ImageEntry; }>({
    "user_3": require("../../../assets/images/icons/test_avatar_4.jpg"),
  })

  const [crumbFeatures, setCrumbFeatures] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [
    ],
  })
  const [selPoi, setSelPoi] = useState<Feature<Geometry, GeoJsonProperties> | null>(null)
  const searchBgCol = useThemeColor({}, "darkBackground")
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

  const handlePlaceSelected = (id: string) => {
    closeSheet()
    setPlaceId(id)
    // focus map on place or drop pin or something
  }

  const newCrumbFeature = (crumbId: string, crumbSender: string, lat: number, lon: number, senderNickname: string, prompt: string, placename: string): Feature<Point, GeoJsonProperties> => {
    return {
      type: 'Feature',
      id: crumbId,
      properties: {
        profilePicture: crumbSender + ".jpg",
        nickname: senderNickname,
        prompt: prompt,
        placename: placename,
      },
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    }
  }

  const updateCrumbs = async () => {
    try {
      const lastCrumb = await GetLastReceivedCrumbDetails();

      const latestCrumb = await getLatestCrumbs(
        false,
        lastCrumb?.id,
        lastCrumb?.time
      );

      if (latestCrumb.message.length > 0) {
        const newFeatures: Feature<Point>[] = latestCrumb.message.map(crumb => (newCrumbFeature(
          crumb.id,
          crumb.sender,
          crumb.lat,
          crumb.lon,
          "C",
          "",
          crumb.placename,
        )));

        setCrumbFeatures(prev => ({
          ...prev,
          features: [...prev.features, ...newFeatures]
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCrumbs = async () => {
    const crumbsInView = await GetAllCrumbs()
    const features: Feature<Point>[] = crumbsInView.map(crumb => (newCrumbFeature(
      crumb.id,
      crumb.sender,
      crumb.lat,
      crumb.lon,
      "C",
      "",
      crumb.placename,
    )));

    setCrumbFeatures({
      type: 'FeatureCollection',
      features
    });
  }

  const headerOpacity = useRef(new Animated.Value(1)).current;

  const fadeHeader = (visible: boolean) => {
    Animated.timing(headerOpacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };


  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        // updateCrumbs();
      }, 5000);

      return () => {
        clearInterval(interval);
        closeSheet();
      };
    }, [closeSheet])
  );

  const gradCol = mode === "dark" || forceDark ? "#000000" : "#ffffff"

  return (
    <View style={[styles.page, { backgroundColor: bgCol }]}>

      <Animated.View style={[styles.headerWrapper, {
        top: 0,
        opacity: headerOpacity,
      }]}>
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
        onMapMove={() => {
          // if (searchResult) setSearchResult(null)
        }}
        onMapPress={() => {
          setDroppedPin(null)
          clearSearchResult()
        }}
        onMapReady={loadCrumbs}
        allowAutoPitch
        activePoi={selPoi}
        dropPinCoord={droppedPin}
        focusOnDroppedPin={focusOnDroppedPin}
        focusOnPoi={focusOnPoi}
        droppedPinRadius={droppedPinRadius}
      />

      <View style={styles.mapControls}>
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
                  userLocation={coordinates}
                  OnPlaceSelect={handlePlaceSelected}
                  sessionToken={sessionToken}
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
