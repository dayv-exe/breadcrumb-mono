import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useCustomGestures } from "@/hooks/useCustomGestures";
import { showSettingsAlert } from "@/utils/helpers";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import CustomButton from "../buttons/CustomButton";

export interface mapMethods {
  moveTo: (position: Position | undefined, newZoomLevel?: number, animationDuration?: number) => void
  centerMap: () => void
  getCurrentCenter: () => Promise<{ position: Position, zoomLevel: number } | null>
}

type customMapProps = {
  mapRef?: React.RefObject<Mapbox.MapView | null>
  handleCancelPress?: () => void
  handlePress?: (v: any) => void
  handleLongPress?: (v: any) => void
  handleUserLocPress?: () => void
  userPosition?: Position
  zoomLevel?: number
  pitch?: number
  useSatellite?: boolean
  setMapMethods: (methods: mapMethods) => void
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
  handleUserLocPress,
  zoomLevel = 3,
  pitch = 0,
  setMapMethods,
  useSatellite = false,
}: customMapProps) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const lightAndroidUrl = Constants.expoConfig?.extra?.lightAndroidMapUrl
  const darkAndroidUrl = Constants.expoConfig?.extra?.darkAndroidMapUrl
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl
  const mode = useColorScheme()
  const cameraRef = useRef<Mapbox.Camera>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const { coordinates } = useLocationStore()
  const [mapReady, setMapReady] = useState(false);
  const movedMap = useRef<boolean>(false)

  const gestures = useCustomGestures(
    {
      onLongPress: (pos) => {
        handleLongPress(pos)
      },
    },
    {
      doubleTapDelay: 300,
      swipeThreshold: 5,
      longPressDelay: 250,
      tapMovementThreshold: 1,
    }
  );

  const methods: mapMethods = {
    moveTo: (position: Position | undefined, newZoomLevel?: number, animationDuration?: number) => {
      cameraRef.current?.setCamera({
        centerCoordinate: position,
        zoomLevel: newZoomLevel || zoomLevel,
        animationDuration: animationDuration ?? 1000,
      })
    },

    getCurrentCenter: async (): Promise<{ position: Position, zoomLevel: number } | null> => {
      try {
        const center = await mapRef?.current?.getCenter();
        const zoom = await mapRef?.current?.getZoom()
        if (!center || !zoom) return null
        return { position: center, zoomLevel: zoom };
      } catch (error) {
        console.error("Error getting map center:", error);
        return null;
      }
    },

    centerMap: () => {

    }
  }

  async function handlePermissions(showPopUp: boolean = true) {
    const status = await Location.requestForegroundPermissionsAsync()

    if (!status.granted && !status.canAskAgain) {
      if (showPopUp) showSettingsAlert("Location")
      return
    }

    if (status.granted) {
      setPermissionGranted(true)
    }
  }

  useEffect(() => {
    handlePermissions(false)
  }, [])

  return (
    <View style={styles.container}>
      {permissionGranted && <Mapbox.MapView
        rotateEnabled={false}
        ref={mapRef}
        style={styles.map}
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => {
          setMapReady(true)
          setMapMethods(methods)
        }}
        styleURL={useSatellite ? satelliteUrl : mode === "light" ? Platform.OS === "android" ? lightUrl : lightUrl : Platform.OS === "android" ? darkUrl : darkUrl}

        onPress={e => {
          handlePress(e)
        }}
        attributionPosition={{ bottom: 100, right: 10 }}
        logoPosition={{ bottom: 70, right: 10 }}
        attributionEnabled={true}
        logoEnabled={true}
        onTouchStart={e => {
          movedMap.current = true
          gestures.handleTouchStart(e)
        }}
        onTouchEnd={gestures.handleTouchEnd}
        onTouchMove={e => {
          gestures.handleTouchMove(e)
        }}
        onTouchCancel={gestures.handleTouchCancel}
      >
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={!movedMap.current ? [coordinates?.longitude ?? 0, coordinates?.latitude ?? 0] : undefined}
          zoomLevel={zoomLevel}
          animationDuration={0}
          pitch={pitch}
        />

      

        {coordinates &&
          <Mapbox.UserLocation
            onPress={handleUserLocPress}
            visible={true}
            minDisplacement={5}
            requestsAlwaysUse={true}
            showsUserHeadingIndicator
          />
        }
      </Mapbox.MapView>}

      {!permissionGranted && <PermissionScreen handleGrantPermission={handlePermissions} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
})