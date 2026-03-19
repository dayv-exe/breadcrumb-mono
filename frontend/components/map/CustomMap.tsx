import { crumb } from "@/api/crumbsApi";
import { useGetCrumbs } from "@/hooks/queries/useCrumbsApi";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useCustomGestures } from "@/hooks/useCustomGestures";
import { showSettingsAlert } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import Constants from "expo-constants";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import { MediaView } from "../media/MediaView";
import { useModal } from "../modals/ModalContext";
import Spacer from "../Spacer";

export interface mapMethods {
  moveTo: (position: Position | undefined, newZoomLevel?: number, animationDuration?: number) => void
  centerMap: () => void
  getCurrentCenter: () => Promise<{ position: Position, zoomLevel: number } | null>
}

type customMapProps = {
  mapRef?: React.RefObject<Mapbox.MapView | null>
  cameraRef?: React.RefObject<Mapbox.Camera | null>
  handleCancelPress?: () => void
  handlePress?: (v: any) => void
  handleLongPress?: (v: any) => void
  handleUserLocPress?: () => void
  userPosition?: Position
  zoomLevel?: number
  pitch?: number
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
  handleCancelPress = () => { },
  handlePress = () => { },
  handleLongPress = () => { },
  mapRef,
  cameraRef,
  handleUserLocPress,
  zoomLevel = 3,
  pitch = 0,
  useSatellite = false,
}: customMapProps) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl;
  const mode = useColorScheme();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { coordinates } = useLocationStore();
  const [mapReady, setMapReady] = useState(false);
  const movedMap = useRef<boolean>(false);

  const { data: crumbsResponse, refetch: refetchCrumbs } = useGetCrumbs();
  const crumbs = crumbsResponse?.message ?? [];

  const gestures = useCustomGestures(
    {
      onLongPress: (pos) => {
        handleLongPress(pos);
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

  const { hideModal, showModal } = useModal()

  const showMed = (mediaKey: string) => {
    showModal({
      content: (
        <>
          <MediaView style={{
            aspectRatio: 9 / 16
          }} mediaKey={mediaKey} fallback={
            <CustomLabel labelText="Failed to load" adaptToTheme />
          } />
          <Spacer />
          <CustomButton labelText="close" type="less-prominent" handleClick={hideModal} />
        </>
      )
    })
  }

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
            handlePress(e);
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
            refetchCrumbs()
            gestures.handleTouchMove(e);
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

          {coordinates && (
            <Mapbox.UserLocation
              onPress={handleUserLocPress}
              visible={true}
              minDisplacement={5}
              requestsAlwaysUse={true}
              showsUserHeadingIndicator
            />
          )}

          {mapReady &&
            crumbs.map((crumb: crumb) => (
              <Mapbox.PointAnnotation
                key={crumb.id ?? `${crumb.lat}-${crumb.lon}`}
                id={crumb.id ?? `${crumb.lat}-${crumb.lon}`}
                coordinate={[parseFloat(crumb.lon), parseFloat(crumb.lat)]}
                onSelected={() => showMed(crumb.mediaKeys[0])}
              >
                <View style={styles.crumbMarker}>
                  <CustomLabel labelText="🍞" fontSize={30} />
                </View>
              </Mapbox.PointAnnotation>
            ))}
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
  crumbMarker: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
});