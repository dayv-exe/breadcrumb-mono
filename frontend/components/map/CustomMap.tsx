import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useCustomGestures } from "@/hooks/useCustomGestures";
import { showSettingsAlert } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox, { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import Constants from "expo-constants";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import CustomButton from "../buttons/CustomButton";


type customMapProps = {
  mapRef?: React.RefObject<Mapbox.MapView | null>
  cameraRef?: React.RefObject<Mapbox.Camera | null>
  onMapPress?: (v: any) => void
  onMapLongPress?: (v: any) => void
  onLocationPuckPress?: () => void
  zoomLevel?: number
  pitch?: number
  zoom?: number
  useSatellite?: boolean
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
}: customMapProps) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl;
  const mode = useColorScheme();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const coordinates = useLocationStore(s => s.coordinates);
  const [mapReady, setMapReady] = useState(false);
  const movedMap = useRef<boolean>(false);

  const featureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: '1',
        properties: { icon: 'pin' },
        geometry: { type: 'Point', coordinates: [-73.99, 40.72] },
      },
      {
        type: 'Feature',
        id: '2',
        properties: { icon: 'pin' },
        geometry: { type: 'Point', coordinates: [-73.98, 40.73] },
      },
    ],
  };

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
    "cluster": [-70, -75],
    "single": [-45, -45]
  }

  const getOffset = mode === "dark" ? offsets.single : offsets.cluster

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
          attributionPosition={{ bottom: 80, left: 5 }}
          logoPosition={{ top: -15, left: 15 }}
          attributionEnabled={true}
          logoEnabled={false}
          onTouchStart={(e) => {
            movedMap.current = true;
            gestures.handleTouchStart(e);
          }}
          onTouchEnd={gestures.handleTouchEnd}
          onTouchMove={(e) => {

          }}
          onTouchCancel={gestures.handleTouchCancel}
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
              lightFrame: require("../../assets/map_bg_light.png"),
              darkFrame: require("../../assets/map_bg_dark.png"),
              clusterFrame: require("../../assets/map_cluster.png"),
              pin: require("../../assets/images/icons/bread_1f35e.png"),
              // avatar: require("../../assets/images/icons/add_sel_vib.png"),
              avatar: require("../../assets/images/icons/test_avatar.jpg")
            }}
          />
          <ShapeSource id="markers" shape={featureCollection}>
            <SymbolLayer
              id="frameLayer"
              style={{
                iconImage: "clusterFrame", // pulls from feature properties
                iconSize: .4,
                iconAllowOverlap: true,
                iconAnchor: 'center',
              }}
            />
            <SymbolLayer
              id="pinLayer"
              style={{
                iconImage: 'avatar', // pulls from feature properties
                iconSize: .125,
                iconAllowOverlap: true,
                iconAnchor: 'center',
                iconOffset: offsets.cluster
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