import { useColorScheme } from "@/hooks/useColorScheme.web";
import { showSettingsAlert } from "@/utils/helpers";
import Mapbox from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import CustomButton from "../buttons/CustomButton";

export interface mapMethods {
  moveTo: (position: Position, newZoomLevel?: number) => void
  moveToUserLocation: (zoomLevel?: number) => void
}

type customMapProps = {
  mapRef?: React.RefObject<Mapbox.MapView | null>
  handlePress?: (v: any) => void
  handleLongPress?: (v: any) => void
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

export default function CustomMap({ handlePress = () => { }, handleLongPress = () => { }, mapRef, userPosition, zoomLevel = 3, pitch = 0, setMapMethods, useSatellite = false }: customMapProps) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl
  const mode = useColorScheme()
  const cameraRef = useRef<Mapbox.Camera>(null)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const [mapReady, setMapReady] = useState(false);

  const methods: mapMethods = {
    moveTo: (position: Position, newZoomLevel?: number) => {
      cameraRef.current?.setCamera({
        centerCoordinate: position,
        zoomLevel: newZoomLevel || zoomLevel,
        animationDuration: 1000
      })
    },

    moveToUserLocation: (newZoomLevel?: number) => {

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
        styleURL={useSatellite ? satelliteUrl : mode === "light" ? lightUrl : darkUrl}
        onPress={e => handlePress(e)}
        onLongPress={e => handleLongPress(e)}
        attributionPosition={{ bottom: 100, right: 10 }}
        attributionEnabled
        logoEnabled={false}
      >
        <Mapbox.Camera ref={cameraRef} centerCoordinate={[-1.393892369785663, 50.918201981005836]} zoomLevel={zoomLevel} animationDuration={0} pitch={pitch} />

        {userPosition &&
          <Mapbox.UserLocation
            visible={true}
            minDisplacement={10}
            requestsAlwaysUse={true} />
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