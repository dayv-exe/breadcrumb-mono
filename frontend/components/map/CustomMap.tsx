import { SelectedLocation } from "@/api/models/locationTypes";
import { RetrieveResponse } from "@/api/models/placeSearch";
import { Colors } from "@/constants/Colors";
import { convertCoordinatesToNumberTuple, convertNumberTupleToCoordinates, getPressedLocationInfo } from "@/constants/mapFunctions";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { showSettingsAlert } from "@/utils/helpers";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import Mapbox, { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import circle from "@turf/circle";
import Constants from "expo-constants";
import * as Location from "expo-location";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useRef, useState } from "react";
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


  const coordinates = useLocationStore((s) => s.coordinates);

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

  async function handleCrumbMarkerPress(e: FeatureCollection) {

  }

  useEffect(() => {
    handlePermissions(false);
  }, []);


  const handleMapPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    onMapPress(e);
    if (mapRef?.current) {
      const collection = await getPressedLocationInfo(e, mapRef);
      const features = collection?.features
      const poi = features?.[0];
      onPoiSelect(poi ?? null)
    }
  };

  const handleMapLongPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    onMapLongPress(e);
    if (e.geometry.type === "Point") {
      const coords = e.geometry.coordinates as [number, number];
      onDroppedPin(coords)
    }
  }

  const offsets = {
    "cluster": [-35, -35],
    "single": [-22, -22]
  }

  const promptTextCol = mode === "dark" || useSatellite ? Colors.dark.text : Colors.light.text
  const promptTextBgCol = mode === "dark" || useSatellite ? Colors.dark.background : Colors.light.background

  const textCol = mode === "dark" || useSatellite ? Colors.dark.text : Colors.light.text
  const textHalo = mode === "dark" || useSatellite ? Colors.dark.background : Colors.light.background
  const textColors = useSatellite ? styleColors.satellite : styleColors[mode === "light" ? "light" : "dark"]

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
          attributionPosition={{ bottom: 80, left: 100 }}
          logoPosition={{ bottom: 80, left: 15 }}
          onDidFinishLoadingMap={async () => {
            onMapReady?.()
            const c = await mapRef?.current?.getCenter()
            setMapCenter?.({
              accuracy: 0,
              latitude: c?.[1] ?? 0,
              longitude: c?.[0] ?? 0
            })
          }}
          onPress={handleMapPress}
          onLongPress={handleMapLongPress}
          onMapIdle={e => {
            onMapIdle?.(e)
            setMapCenter?.({
              accuracy: 0,
              latitude: e.properties.center[1],
              longitude: e.properties.center[0]
            })
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
              frame: mode === "dark" || useSatellite ? require("../../assets/map_bg_dark.png") : require("../../assets/map_bg_light.png"),
              clusterFrame: require("../../assets/map_cluster.png"),
              clusterFg: require("../../assets/cluster_fg.png"),
              ...(featureCollectionImages || {}),
            }}
          />

          {selectedLocation && selectedLocation.type === "pin" && (
            <>
              <Mapbox.ShapeSource
                id="pin-radius-source"
                shape={circle(convertCoordinatesToNumberTuple(selectedLocation.coordinates), selectedLocation.radius, {
                  steps: 64,
                  units: "meters",
                })}
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
                shape={{
                  type: "Feature",
                  geometry: { type: "Point", coordinates: convertCoordinatesToNumberTuple(selectedLocation.coordinates) },
                  properties: {},
                }}
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
            </>
          )}

          {
            searchResult?.features[0] &&
            <Mapbox.ShapeSource
              id="search-pin-source"
              shape={{
                type: "Feature",
                geometry: { type: "Point", coordinates: searchResult?.features[0].geometry.coordinates },
                properties: searchResult.features[0].properties,
              }}
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
          }

          {selectedLocation && selectedLocation.type === "poi" && selectedLocation.poi.geometry.type === "Point" && (
            <Mapbox.ShapeSource id="active-poi-source" shape={selectedLocation.poi}>
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
          )}

          {coordinates && (
            <Mapbox.UserLocation
              visible
              minDisplacement={5}
              requestsAlwaysUse
              showsUserHeadingIndicator
              onPress={onLocationPuckPress}
            />
          )}

          {<ShapeSource ref={markersRef} id="markers" shape={featureCollection} cluster clusterRadius={50} clusterMaxZoomLevel={22} onPress={async e => {
            const feature = e.features[0];
            if (!feature) return;
            const coords = convertNumberTupleToCoordinates((feature.geometry as any).coordinates as [number, number])

            // cluster
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
              // single unclustered point
              const id = feature.id?.toString();
              if (!id) return;
              onCrumbsSelect?.([id], coords);
            }
          }}>
            <SymbolLayer
              id="frameLayer"
              style={{
                iconImage: "frame",
                iconSize: .36,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconIgnorePlacement: true,
              }}
            />

            <SymbolLayer
              id="bgLayer"
              style={{
                iconImage: 'clusterFg',
                iconSize: .3,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: [-17, -17],
                iconIgnorePlacement: true
              }}
            />

            <SymbolLayer
              id="textLayer"
              style={{
                textField: ["get", "nickname"],
                textSize: 17,
                textColor: Colors.light.text,
                textIgnorePlacement: true,
                textAllowOverlap: true,
                textOffset: [-.275, -.25],
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
              id="pinLayer"
              style={{
                iconImage: ["get", "profilePicture"],
                iconSize: .225,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: offsets.single,
                iconIgnorePlacement: true
              }}
            />

            <SymbolLayer
              id="clusteredPoints"
              filter={["has", "point_count"]}
              style={{
                iconImage: "clusterFrame",
                iconSize: .36,
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />

            <SymbolLayer
              id="clusterimg"
              filter={["has", "point_count"]}
              style={{
                iconImage: 'clusterFg',
                iconSize: .29,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: [-26, -29],
                iconIgnorePlacement: true
              }}
            />

            <SymbolLayer
              id="clusterCount"
              filter={["has", "point_count"]}
              style={{
                textField: ["concat", "+", ["get", "point_count_abbreviated"]],
                textSize: 17,
                textColor: Colors.light.text,
                textIgnorePlacement: true,
                textAllowOverlap: true,
                textOffset: [-.5, -.5],
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