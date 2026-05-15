import { getPressedLocationInfo } from "@/constants/mapFunctions";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { showSettingsAlert } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox, { Images } from "@rnmapbox/maps";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";

type CustomMapProps = {
  mapRef?: React.RefObject<Mapbox.MapView | null>;
  cameraRef?: React.RefObject<Mapbox.Camera | null>;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  pitch?: number;
  onMapPress?: (e: Feature<Geometry, GeoJsonProperties>) => void;
  onMapLongPress?: (e: Feature<Geometry, GeoJsonProperties>) => void;
  onLocationPuckPress?: () => void;
  activePoi: Feature<Geometry, GeoJsonProperties> | null
  setActivePoi: (poi: Feature<Geometry, GeoJsonProperties> | null) => void
  dropPinCoord: [number, number] | null
  setDropPinCoord: (coords: [number, number] | null) => void
  useSatellite?: boolean;
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
  setActivePoi,
  dropPinCoord,
  setDropPinCoord,
  onMapPress = () => { },
  onMapLongPress = () => { },
  onLocationPuckPress,
  useSatellite,
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

  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  const handleMapPress = async (e: Feature<Geometry, GeoJsonProperties>) => {
    setHasAnimatedIn(false);
    const curZoom = mapRef?.current?.getZoom()
    if (mapRef?.current) {
      const collection = await getPressedLocationInfo(e, mapRef);
      const features = collection?.features
      const poi = features?.[0];

      if (poi) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActivePoi(poi);
        setDropPinCoord(null)
        requestAnimationFrame(() => setHasAnimatedIn(true));
        cameraRef?.current?.setCamera({
          centerCoordinate: (poi.geometry as any).coordinates as [number, number],
          zoomLevel: await curZoom,
          animationDuration: 400,
          animationMode: "easeTo",
        })
        return;
      }
    }

    setActivePoi(null);
    setDropPinCoord(null)
    onMapPress(e);
  };

  const handleMapLongPress = (e: Feature<Geometry, GeoJsonProperties>) => {
    if (e.geometry.type === "Point") {
      const coords = e.geometry.coordinates as [number, number];
      setDropPinCoord(coords);
      setActivePoi(null)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onMapLongPress(e);
  }

  const initialCenter =
    centerCoordinate ??
    (coordinates
      ? [coordinates.longitude, coordinates.latitude]
      : [0, 0]);

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
              "droppedPin": require("../../assets/drop_pin.png")
            }}
          />

          {/* Hide the base style's version of the active feature on every selectable layer */}
          {/* {
            SELECTABLE_MAPBOX_LAYER.filter(layer => layer === activePoi?.properties.sourceLayer).map((layerId) => (
              <Mapbox.SymbolLayer
                key={layerId}
                id={layerId}
                existing
                style={{}}
                filter={[
                  "!=",
                  ["get", "name"],
                  (activePoi?.properties?.name as string ?? ""),
                ]}
              />
            ))} */}

          {dropPinCoord && (
            <Mapbox.PointAnnotation
              id="dropped-pin"
              coordinate={dropPinCoord}
              anchor={{x: 0.5, y: 1}}
              draggable
              onDragEnd={(e) => {
                const coords = (e.geometry as any).coordinates as [number, number];
                setDropPinCoord(coords);
              }}
            >
              <Image source={require("../../assets/drop_pin.png")} style={{
                width: 40, height: 40
              }} />
            </Mapbox.PointAnnotation>
          )}

          {activePoi && activePoi.geometry.type === "Point" && (
            <Mapbox.ShapeSource id="active-poi-source" shape={activePoi}>
              {/* Category icon on top */}
              <Mapbox.SymbolLayer
                id="active-poi-icon"
                style={{
                  iconImage: ["coalesce", ["get", "maki"], ["get", "icon"], ["get", "class"]],
                  iconSize: 2,
                  iconColor: "#ffffff",
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                  iconOffset: [0, -5],
                }}
              />
              {/* Label below */}
              <Mapbox.SymbolLayer
                id="active-poi-label"
                style={{
                  textField: ["coalesce", ["get", "name_en"], ["get", "name"]],
                  textSize: /*14*/0,
                  textOffset: [0, 1.6],
                  textAnchor: "top",
                  textHaloColor: mode === "dark" ? "#000" : "#ffffff",
                  textHaloWidth: 1,
                  textColor: mode === "dark" ? "#ffffff" : "#000000",
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
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