import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useCustomGestures } from "@/hooks/useCustomGestures";
import { showSettingsAlert } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox, { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import Constants from "expo-constants";
import * as Location from "expo-location";
import type { FeatureCollection } from "geojson";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";

type customMapProps = {
  mapRef?: React.RefObject<Mapbox.MapView | null>
  cameraRef?: React.RefObject<Mapbox.Camera | null>
  onMapPress?: (v: any) => void
  onMapLongPress?: (v: any) => void
  onLocationPuckPress?: () => void
  maxZoomLvlToDark: number
  setForceDark: (s: boolean) => void
  zoomLevel?: number
  pitch?: number
  zoom?: number
  useSatellite?: boolean
  featureCollectionImages?: { [key: string]: Mapbox.ImageEntry; }
  featureCollection?: FeatureCollection
}

type permissionProps = {
  handleGrantPermission: () => void
}

function PermissionScreen({ handleGrantPermission }: permissionProps) {
  const mode = useColorScheme()

  return (
    <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: mode === "dark" ? "#1c1c1c" : "#fafafa"
    }}>
      <CustomLabel textAlign="center" adaptToTheme labelText="🔐" fontSize={21} />
      <CustomLabel width="80%" textAlign="center" adaptToTheme labelText="Allow location access to see nearby walls and crumbs on the map." />
      <CustomButton type="less-vibrant-text" labelText="Grant Permission" handleClick={handleGrantPermission} />
    </View>
  )
}

export default function CustomMap({
  onMapPress = () => { },
  onMapLongPress = () => { },
  mapRef,
  cameraRef,
  onLocationPuckPress,
  zoomLevel = 3,
  pitch = 0,
  useSatellite = false,
  maxZoomLvlToDark,
  setForceDark,
  featureCollection,
  featureCollectionImages
}: customMapProps) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl;
  const mode = useColorScheme();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const coordinates = useLocationStore(s => s.coordinates);
  const [mapReady, setMapReady] = useState(false);
  const movedMap = useRef<boolean>(false);

  const gestures = useCustomGestures(
    {
      onLongPress: (pos) => {
        onMapLongPress(pos);
      },
    },
    {
      doubleTapDelay: 300,
      swipeThreshold: 5,
      longPressDelay: 250,
      tapMovementThreshold: 1,
    }
  );

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

  const offsets = {
    "cluster": [-35, -35],
    "single": [-22, -22]
  }

  const promptTextCol = mode === "dark" || useSatellite ? Colors.dark.text : Colors.light.text
  const promptTextBgCol = mode === "dark" || useSatellite ? Colors.dark.background : Colors.light.background

  return (
    <View style={styles.container}>
      {permissionGranted && (
        <Mapbox.MapView
          rotateEnabled={true}
          compassFadeWhenNorth
          compassEnabled
          compassPosition={{ top: 65, right: 12 }}
          ref={mapRef}
          style={styles.map}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={() => {
            setMapReady(true);
          }}
          styleURL={useSatellite ? satelliteUrl : mode === "light" ? lightUrl : darkUrl}
          onPress={(e) => {
            onMapPress(e);
          }}
          attributionPosition={{ bottom: 100, left: 10 }}
          logoPosition={{ bottom: 75, left: 10 }}
          attributionEnabled={true}
          logoEnabled={true}
          onTouchStart={(e) => {
            movedMap.current = true;
            gestures.handleTouchStart(e);
          }}
          onTouchEnd={gestures.handleTouchEnd}
          onTouchMove={(e) => {

          }}
          onTouchCancel={gestures.handleTouchCancel}
          onCameraChanged={e => {
            if (e.properties.zoom <= maxZoomLvlToDark) {
              setForceDark(true)
            } else {
              setForceDark(false)
            }
          }}
        >
          <Mapbox.Camera
            ref={cameraRef}
            centerCoordinate={
              !movedMap.current
                ? [coordinates?.longitude ?? 0, coordinates?.latitude ?? 0]
                : undefined
            }
            zoomLevel={zoomLevel}
            animationDuration={0}
            pitch={pitch}
          />

          {mapReady && coordinates && (
            <Mapbox.UserLocation
              onPress={onLocationPuckPress}
              visible={true}
              minDisplacement={5}
              requestsAlwaysUse={true}
              showsUserHeadingIndicator
            />
          )}
          <Images
            images={{
              frame: mode === "dark" || useSatellite ? require("../../assets/map_bg_dark.png") : require("../../assets/map_bg_light.png"),
              clusterFrame: require("../../assets/map_cluster.png"),
              clusterFg: require("../../assets/cluster_fg.png"),
              ...(featureCollectionImages || {}),
            }}
          />
          <ShapeSource id="markers" shape={featureCollection} cluster clusterRadius={50} clusterMaxZoomLevel={14}>
            <SymbolLayer
              id="frameLayer"
              style={{
                iconImage: "frame",
                iconSize: .36,
                iconAllowOverlap: true,
                iconAnchor: 'center',
              }}
            />

            <SymbolLayer
              id="bgLayer"
              style={{
                iconImage: 'clusterFg',
                iconSize: .3,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: [-17, -17]
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
                textField: ["get", "prompt"],
                textSize: 11,
                textColor: promptTextCol,
                textHaloColor: promptTextBgCol,
                textHaloWidth: 1,
                textIgnorePlacement: true,
                textAllowOverlap: true,
                textOffset: [-.5, 3],
              }}
            />

            <SymbolLayer
              id="pinLayer"
              style={{
                iconImage: ["get", "profilePicture"],
                iconSize: .225,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: offsets.single
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
                iconOffset: [-27, -27]
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
      )}

      {!permissionGranted && (
        <PermissionScreen handleGrantPermission={handlePermissions} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});