import { SelectedLocation } from "@/api/models/locationTypes";
import { RetrieveResponse } from "@/api/models/placeSearch";
import { Colors } from "@/constants/Colors";
import { convertCoordinatesToNumberTuple, convertNumberTupleToCoordinates } from "@/constants/mapFunctions";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { showSettingsAlert } from "@/utils/helpers";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import Mapbox, { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import circle from "@turf/circle";
import Constants from "expo-constants";
import * as Location from "expo-location";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import darkStyle from "../../assets/styles/dark-style.json";
import lightStyle from "../../assets/styles/light-style.json";
import satelliteStyle from "../../assets/styles/satellite-style.json";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";

function extract(style: any) {
  const poi = style.layers.find((l: any) => l.id === "poi-label");
  return {
    poiTextColor: poi?.paint?.["text-color"],
    poiHaloColor: poi?.paint?.["text-halo-color"],
  };
}

export const styleColors = {
  light: extract(lightStyle),
  dark: extract(darkStyle),
  satellite: extract(satelliteStyle),
};

type CustomMapProps = {
  selectedLocation: SelectedLocation | null
  onMapReady?: () => void
  mapRef?: React.RefObject<Mapbox.MapView | null>;
  cameraRef?: React.RefObject<Mapbox.Camera | null>;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  pitch?: number;
  onMapPress?: (e: Feature<Geometry, GeoJsonProperties>) => void;
  onMapLongPress?: (e: Feature<Geometry, GeoJsonProperties>) => void;
  onLocationPuckPress?: () => void;
  searchResult?: RetrieveResponse | null
  onPoiSelect: (poi: Feature<Geometry, GeoJsonProperties> | null) => void
  onDroppedPin: (coords: [number, number]) => void
  onCrumbsSelect?: (crumbIds: string[], coordinates: Coordinates) => void
  maxZoomLvlToDark?: number
  setForceDark?: (s: boolean) => void
  useSatellite?: boolean;
  allowAutoPitch?: boolean
  is2dButtonVisible: boolean
  set2dButtonVisible: (s: boolean) => void
  lock2dButtonAsHidden: boolean
  featureCollectionImages?: { [key: string]: Mapbox.ImageEntry; }
  featureCollection?: FeatureCollection,
  onMapMove?: (e: Mapbox.MapState) => void
  onMapIdle?: (e: Mapbox.MapState) => void
  setMapCenter?: (c: Coordinates) => void
  cameraBottomPadding?: number
};

type PermissionProps = {
  handleGrantPermission: () => void;
};

function PermissionScreen({ handleGrantPermission }: PermissionProps) {
  const mode = useColorScheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: mode === "dark" ? "#1c1c1c" : "#fafafa",
      }}
    >
      <CustomLabel textAlign="center" adaptToTheme labelText="🔐" fontSize={21} />
      <CustomLabel
        width="80%"
        textAlign="center"
        adaptToTheme
        labelText="Allow location access to see your position on the map."
      />
      <CustomButton
        type="less-vibrant-text"
        labelText="Grant Permission"
        handleClick={handleGrantPermission}
      />
    </View>
  );
}

export default function CustomMap({
  mapRef,
  cameraRef,
  selectedLocation,
  centerCoordinate,
  zoomLevel = 14,
  pitch = 0,
  onMapPress = () => { },
  onMapLongPress = () => { },
  onLocationPuckPress,
  useSatellite,
  is2dButtonVisible,
  set2dButtonVisible,
  featureCollection,
  featureCollectionImages,
  maxZoomLvlToDark,
  onMapReady,
  onDroppedPin,
  onPoiSelect,
  onCrumbsSelect,
  setForceDark,
  searchResult,
  onMapMove,
  onMapIdle,
  lock2dButtonAsHidden,
  setMapCenter,
  cameraBottomPadding,
}: CustomMapProps) {
  const markersRef = useRef<Mapbox.ShapeSource>(null)
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl;
  const mode = useColorScheme();

  const [permissionGranted, setPermissionGranted] = useState(false);

  const { height } = useWindowDimensions()
  const { top: insetTop } = useSafeAreaInsets()

  async function handlePermissions(showPopUp: boolean = true) {
    const status = await Location.requestForegroundPermissionsAsync();

    if (!status.granted && !status.canAskAgain) {
      if (showPopUp) showSettingsAlert("Location");
      return;
    }

    if (status.granted) {
      setPermissionGranted(true);
    }
  }

  useEffect(() => {
    handlePermissions(false);
  }, []);


  const handleMapPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    onMapPress(e);
    // if (mapRef?.current) {
    //   const collection = await getPressedLocationInfo(e, mapRef);
    //   const features = collection?.features
    //   const poi = features?.[0];
    //   onPoiSelect(poi ?? null)
    // }
  };

  const handleMapLongPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    onMapLongPress(e);
    // if (e.geometry.type === "Point") {
    //   const coords = e.geometry.coordinates as [number, number];
    //   onDroppedPin(coords)
    // }
  }

  const offsets = {
    "cluster": [-35, -35],
    "single": [0, 0]
  }

  const promptTextCol = mode === "dark" || useSatellite ? Colors.dark.text : Colors.light.text
  const promptTextBgCol = mode === "dark" || useSatellite ? Colors.dark.background : Colors.light.background

  const textCol = mode === "dark" || useSatellite ? Colors.dark.text : Colors.light.text
  const textHalo = mode === "dark" || useSatellite ? Colors.dark.background : Colors.light.background
  const textColors = useSatellite ? styleColors.satellite : styleColors[mode === "light" ? "light" : "dark"]

  const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

  const shapes = useMemo(() => {
    const pin = selectedLocation?.type === "pin" ? selectedLocation : null;
    const poi =
      selectedLocation?.type === "poi" && selectedLocation.poi.geometry.type === "Point"
        ? selectedLocation.poi
        : null;
    const search = searchResult?.features[0];

    const pinCoords = pin ? convertCoordinatesToNumberTuple(pin.coordinates) : null;

    return {
      pinRadius: pin && pinCoords
        ? circle(pinCoords, pin.radius, { steps: 64, units: "meters" })
        : EMPTY,
      pinPoint: pinCoords
        ? { type: "Feature", geometry: { type: "Point", coordinates: pinCoords }, properties: {} } as Feature
        : EMPTY,
      search: search
        ? { type: "Feature", geometry: { type: "Point", coordinates: search.geometry.coordinates }, properties: search.properties } as Feature
        : EMPTY,
      poi: poi ?? EMPTY,
    };
  }, [selectedLocation, searchResult]);

  return (
    <View onTouchStart={Keyboard.dismiss} style={styles.container}>
      {permissionGranted ? (
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          styleURL={useSatellite ? satelliteUrl : mode === "light" ? lightUrl : darkUrl}
          scaleBarEnabled={false}
          compassEnabled
          compassFadeWhenNorth
          maxPitch={45}
          compassPosition={{ top: (.1 * height) + (Platform.OS === "android" ? insetTop : 0), right: 15 }}
          onDidFinishLoadingMap={async () => {
            const coords = useLocationStore.getState().coordinates
            onMapReady?.()
            setMapCenter?.(coords ?? { accuracy: 0, latitude: 0, longitude: 0 })
          }}
          onPress={handleMapPress}
          onLongPress={handleMapLongPress}
          onMapIdle={e => {
            onMapIdle?.(e)
          }}
          onCameraChanged={async e => {
            onMapMove?.(e)
            if (maxZoomLvlToDark && setForceDark) {
              if (e.properties.zoom <= maxZoomLvlToDark) {
                setForceDark(true)
              } else {
                setForceDark(false)
              }
            }

            if (!set2dButtonVisible) return
            if (e.properties.pitch !== 0 && !lock2dButtonAsHidden) {
              if (is2dButtonVisible) return
              set2dButtonVisible(true)
            } else {
              if (!is2dButtonVisible) return
              set2dButtonVisible(false)
            }
          }}
        >
          <Mapbox.Camera
            ref={cameraRef}
            centerCoordinate={centerCoordinate}
            zoomLevel={zoomLevel}
            pitch={pitch}
            animationDuration={0}
            padding={{
              paddingLeft: 0,
              paddingRight: 0,
              paddingTop: 0,
              paddingBottom: cameraBottomPadding ?? 0,
            }}
          />

          <Images
            images={{
              dropped_pin: require("../../assets/map_pin.png"),
              frame: require("../../assets/crumb.png"),
              clusterFrame: require("../../assets/newcluster.png"),
              dropShadow: require("../../assets/frame_shadow.png"),
              countPill: {
                image: require("../../assets/textBg.png"),
                scale: 1,
                stretchX: [[3, 47]],
                stretchY: [[3, 17]],
                sdf: true,
              },
              ...(featureCollectionImages || {}),
            }}
          />

          <Mapbox.ShapeSource
            id="pin-radius-source"
            shape={shapes.pinRadius}
          >
            <Mapbox.FillLayer
              id="pin-radius-fill"
              style={{
                fillColor: mode === "dark" || useSatellite ? "red" : Colors.light.tint,
                fillOpacity: mode === "dark" ? .6 : 0.15,
              }}
            />
            <Mapbox.LineLayer
              id="pin-radius-outline"
              style={{
                lineColor: mode === "dark" || useSatellite ? "red" : Colors.light.tint,
                lineWidth: 2,
                lineOpacity: mode === "dark" ? .6 : 0.6,
              }}
            />
          </Mapbox.ShapeSource>

          <Mapbox.ShapeSource
            id="dropped-pin-source"
            shape={shapes.pinPoint}
          >
            <Mapbox.SymbolLayer
              id="dropped-pin-layer"
              style={{
                iconImage: "dropped_pin",
                iconSize: 0.175,
                iconAnchor: "bottom",
                iconAllowOverlap: true,
              }}
            />
          </Mapbox.ShapeSource>

          <Mapbox.ShapeSource
            id="search-pin-source"
            shape={shapes.search}
          >
            <Mapbox.SymbolLayer
              id="search-pin-layer"
              style={{
                iconImage: "dropped_pin",
                iconSize: 0.15,
                iconAnchor: "bottom",
                iconAllowOverlap: true,
                iconIgnorePlacement: true
              }}
            />

            <Mapbox.SymbolLayer
              id="search-text-layer"
              style={{
                textAllowOverlap: true,
                textIgnorePlacement: true,
                textAnchor: "left",
                textField: ["get", "name"],
                textHaloColor: textHalo,
                textColor: textCol,
                textHaloWidth: 1,
                textMaxWidth: 7,
                textSize: 12,
                textOffset: [1.75, -2],
                textJustify: "left"
              }}
            />
          </Mapbox.ShapeSource>

          <Mapbox.ShapeSource id="active-poi-source" shape={shapes.poi}>
            <Mapbox.SymbolLayer
              id="active-poi-icon"
              style={{
                iconImage: ["coalesce", ["get", "maki"], ["get", "icon"], ["get", "class"], ["literal", "marker"]],
                iconSize: 2.5,
                iconColor: "#ffffff",
                iconAllowOverlap: true,
                iconIgnorePlacement: false,
                textAllowOverlap: true,
                textIgnorePlacement: false,
                iconOffset: [0, -5],
              }}
            />
            <Mapbox.SymbolLayer
              id="active-poi-label"
              style={{
                textField: ["coalesce", ["get", "name_en"], ["get", "name"], ["get", "house_num"]],
                textSize: 13,
                textMaxWidth: 7,
                textOffset: [0, .75],
                textAnchor: "top",
                textHaloColor: textColors.poiHaloColor,
                textHaloWidth: 1,
                textColor: textColors.poiTextColor,
                textAllowOverlap: false,
                textIgnorePlacement: false,
              }}
            />
          </Mapbox.ShapeSource>

          <Mapbox.UserLocation
            visible
            minDisplacement={5}
            requestsAlwaysUse
            showsUserHeadingIndicator
            onPress={onLocationPuckPress}
          >
            <Mapbox.CircleLayer
              id="userPuckHalo"
              belowLayerID="shadowLayer"
              style={{
                circleRadius: 11,
                circleColor: "#ffffff",
                circlePitchAlignment: "map",
              }}
            />
            <Mapbox.CircleLayer
              id="userPuckDot"
              aboveLayerID="userPuckHalo"
              style={{
                circleRadius: 7,
                circleColor: "#4264fb",
                circlePitchAlignment: "map",
              }}
            />
          </Mapbox.UserLocation>

          {<ShapeSource
            ref={markersRef}
            id="markers"
            shape={featureCollection}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={22}
            onPress={async e => {
              const feature = e.features[0];
              if (!feature) return;
              const coords = convertNumberTupleToCoordinates((feature.geometry as any).coordinates as [number, number])

              if (feature.properties?.cluster) {
                const leaves: FeatureCollection = await markersRef.current?.getClusterLeaves(
                  feature,
                  feature.properties.point_count,
                  0,
                );


                const crumbs = leaves?.features ?? [];

                const ids = crumbs
                  .map((c) => c.id?.toString())
                  .filter((id): id is string => !!id);
                onCrumbsSelect?.(ids, coords)
              } else {
                const id = feature.id?.toString();
                if (!id) return;
                onCrumbsSelect?.([id], coords);
              }
            }}
            clusterProperties={{
              latestPicture: [
                ["case",
                  ["<", ["accumulated"], ["get", "latestPicture"]],
                  ["accumulated"],
                  ["get", "latestPicture"],
                ],
                ["get", "latestPicture"],
              ],
              latestInitials: [
                ["case",
                  ["<", ["accumulated"], ["get", "latestInitials"]],
                  ["accumulated"],
                  ["get", "latestInitials"],
                ],
                ["get", "latestInitials"],
              ]
            }}
          >
            <SymbolLayer
              id="shadowLayer"
              filter={["!", ["has", "point_count"]]}
              style={{
                iconImage: "dropShadow",
                iconSize: .335,
                iconOpacity: .5,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconIgnorePlacement: true,
                iconOffset: [0, 0],
              }}
            />

            <SymbolLayer
              id="frameLayer"
              filter={["!", ["has", "point_count"]]}
              style={{
                iconImage: "frame",
                iconSize: .335,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconIgnorePlacement: true,
              }}
            />

            <SymbolLayer
              id="textLayer"
              filter={["!", ["has", "point_count"]]}
              style={{
                textField: ["get", "nickname"],
                textColor: Colors.light.text,
                textIgnorePlacement: true,
                textAllowOverlap: true,
                textOffset: [0, -.3],
                textHaloColor: "black",
                textHaloWidth: .275,
                textSize: 15,
              }}
            />

            <SymbolLayer
              id="pinLayer"
              filter={["!", ["has", "point_count"]]}
              style={{
                iconImage: ["get", "profilePicture"],
                iconSize: .290,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: [0, -13],
                iconIgnorePlacement: true,
              }}
            />

            <SymbolLayer
              id="promptLayer"
              style={{
                textField: [
                  "case",
                  ["==", ["get", "prompt"], ""],
                  ["get", "placename"],
                  ["get", "prompt"]
                ],
                textSize: 12,
                textColor: promptTextCol,
                textHaloColor: promptTextBgCol,
                textHaloWidth: 1,
                textIgnorePlacement: true,
                textAllowOverlap: true,
                textOffset: [-.5, 3.2],
                textOpacity: 0,
              }}
            />

            <SymbolLayer
              id="clusterShadowLayer"
              filter={["has", "point_count"]}
              style={{
                iconImage: "dropShadow",
                iconOpacity: .5,
                iconSize: .325,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconIgnorePlacement: true,
                iconOffset: [18, 18]
              }}
            />

            <SymbolLayer
              id="clusteredPoints"
              filter={["has", "point_count"]}
              style={{
                iconImage: "clusterFrame",
                iconSize: .325,
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />

            <SymbolLayer
              id="clusterTextLayer"
              filter={["has", "point_count"]}
              style={{
                textField: ["slice", ["get", "latestInitials"], 6],
                textColor: Colors.light.text,
                textIgnorePlacement: true,
                textAllowOverlap: true,
                textOffset: [-.15, -.5],
                textHaloColor: "black",
                textHaloWidth: .5,
                textSize: 17,
              }}
            />

            <SymbolLayer
              id="clusterImageLayer"
              filter={["has", "point_count"]}
              style={{
                iconImage: ["slice", ["get", "latestPicture"], 6],
                iconSize: .285,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: [-12, -25],
                iconIgnorePlacement: true,
              }}
            />

            <SymbolLayer
              id="clusterCount"
              filter={["has", "point_count"]}
              style={{
                iconImage: "countPill",
                iconColor: "#ffffff",
                iconTextFit: "both",
                iconTextFitPadding: [0, 3, 0, 3],
                iconAllowOverlap: true,
                iconIgnorePlacement: true,

                textField: ["concat", "+", ["to-string", ["-", ["get", "point_count"], 1]]],
                textHaloWidth: .25,
                textHaloColor: "rgba(0, 0, 0, .35)",
                textSize: 15,
                textColor: "rgba(0, 0, 0, .35)",
                textAnchor: "top-right",
                textOffset: [1.225, .23],
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
          </ShapeSource>}
        </Mapbox.MapView>
      ) : (
        <PermissionScreen handleGrantPermission={handlePermissions} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff3b30",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
});