import { Colors } from "@/constants/Colors";
import { getPressedLocationInfo } from "@/constants/mapFunctions";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { showSettingsAlert } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox, { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import circle from "@turf/circle";
import Constants from "expo-constants";
import * as Location from "expo-location";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";

type CustomMapProps = {
  onMapReady?: () => void
  mapRef?: React.RefObject<Mapbox.MapView | null>;
  cameraRef?: React.RefObject<Mapbox.Camera | null>;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  pitch?: number;
  onMapPress?: (e: Feature<Geometry, GeoJsonProperties>) => void;
  onMapLongPress?: (e: Feature<Geometry, GeoJsonProperties>) => void;
  onLocationPuckPress?: () => void;
  activePoi?: Feature<Geometry, GeoJsonProperties> | null
  dropPinCoord?: [number, number] | null
  focusOnPoi: (poi: Feature<Geometry, GeoJsonProperties> | null) => void
  focusOnDroppedPin: (coords: [number, number]) => void
  droppedPinRadius?: number
  maxZoomLvlToDark?: number
  setForceDark?: (s: boolean) => void
  useSatellite?: boolean;
  allowAutoPitch?: boolean
  is2dButtonVisible?: boolean
  set2dButtonVisible?: (s: boolean) => void
  featureCollectionImages?: { [key: string]: Mapbox.ImageEntry; }
  featureCollection?: FeatureCollection,
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
  centerCoordinate,
  zoomLevel = 14,
  pitch = 0,
  activePoi,
  dropPinCoord,
  onMapPress = () => { },
  onMapLongPress = () => { },
  onLocationPuckPress,
  useSatellite,
  is2dButtonVisible,
  set2dButtonVisible,
  droppedPinRadius,
  featureCollection,
  featureCollectionImages,
  maxZoomLvlToDark,
  onMapReady,
  focusOnDroppedPin,
  focusOnPoi,
  setForceDark,
}: CustomMapProps) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl;
  const mode = useColorScheme();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const movedMap = useRef(false);


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

  useEffect(() => {
    handlePermissions(false);
  }, []);


  const handleMapPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    onMapPress(e);
    if (mapRef?.current) {
      const collection = await getPressedLocationInfo(e, mapRef);
      const features = collection?.features
      const poi = features?.[0];
      focusOnPoi(poi ?? null)
    }
  };

  const handleMapLongPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    onMapLongPress(e);
    if (e.geometry.type === "Point") {
      const coords = e.geometry.coordinates as [number, number];
      focusOnDroppedPin(coords)
    }
  }

  const initialCenter =
    centerCoordinate ??
    (coordinates
      ? [coordinates.longitude, coordinates.latitude]
      : [0, 0]);

  const offsets = {
    "cluster": [-35, -35],
    "single": [-22, -22]
  }

  const promptTextCol = mode === "dark" || useSatellite ? Colors.dark.text : Colors.light.text
  const promptTextBgCol = mode === "dark" || useSatellite ? Colors.dark.background : Colors.light.background

  return (
    <View style={styles.container}>
      {permissionGranted ? (
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          styleURL={useSatellite ? satelliteUrl : mode === "light" ? lightUrl : darkUrl}
          scaleBarEnabled={false}
          compassEnabled
          compassFadeWhenNorth
          compassPosition={{ top: 65, right: 12 }}
          attributionPosition={{ bottom: 100, left: 10 }}
          logoPosition={{ bottom: 75, left: 10 }}
          onDidFinishLoadingMap={() => setMapReady(true)}
          onPress={handleMapPress}
          onLongPress={handleMapLongPress}
          onTouchStart={() => {
            movedMap.current = true;
          }}
          onCameraChanged={async e => {

            if (maxZoomLvlToDark && setForceDark) {
              if (e.properties.zoom <= maxZoomLvlToDark) {
                setForceDark(true)
              } else {
                setForceDark(false)
              }
            }

            if (!set2dButtonVisible) return
            if (e.properties.pitch !== 0) {
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
            centerCoordinate={!movedMap.current ? initialCenter : undefined}
            zoomLevel={zoomLevel}
            pitch={pitch}
            animationDuration={0}
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

          {dropPinCoord && droppedPinRadius && (
            <>
              <Mapbox.ShapeSource
                id="pin-radius-source"
                shape={circle(dropPinCoord, droppedPinRadius, {
                  steps: 64,
                  units: "meters",
                })}
              >
                <Mapbox.FillLayer
                  id="pin-radius-fill"
                  style={{
                    fillColor: mode === "dark" ? "purple" : Colors.light.tint,
                    fillOpacity: mode === "dark" ? 0.4 : 0.15,
                  }}
                />
                <Mapbox.LineLayer
                  id="pin-radius-outline"
                  style={{
                    lineColor: mode === "dark" ? "purple" : Colors.light.tint,
                    lineWidth: 2,
                    lineOpacity: mode === "dark" ? 0.8 : 0.6,
                  }}
                />
              </Mapbox.ShapeSource>

              {/* Then your existing pin SymbolLayer below so it renders on top */}
              <Mapbox.ShapeSource
                id="dropped-pin-source"
                shape={{
                  type: "Feature",
                  geometry: { type: "Point", coordinates: dropPinCoord },
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

          {activePoi && activePoi.geometry.type === "Point" && (
            <Mapbox.ShapeSource id="active-poi-source" shape={activePoi}>
              {/* Category icon on top */}
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
              {/* Label below */}
              <Mapbox.SymbolLayer
                id="active-poi-label"
                style={{
                  textField: ["coalesce", ["get", "name_en"], ["get", "name"], ["get", "house_num"]],
                  textSize: 15,
                  textMaxWidth: 7,
                  textOffset: [0, .75],
                  textAnchor: "top",
                  textHaloColor: mode === "dark" ? "#000" : "#ffffff",
                  textHaloWidth: 1,
                  textColor: mode === "dark" ? "#ffffff" : "#000000",
                  textAllowOverlap: false,
                  textIgnorePlacement: false,
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {mapReady && coordinates && (
            <Mapbox.UserLocation
              visible
              minDisplacement={5}
              requestsAlwaysUse
              showsUserHeadingIndicator
              onPress={onLocationPuckPress}
            />
          )}

          <ShapeSource id="markers" shape={featureCollection} cluster clusterRadius={50} clusterMaxZoomLevel={22}>
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
                iconOffset: [-27, -27],
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
          </ShapeSource>
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