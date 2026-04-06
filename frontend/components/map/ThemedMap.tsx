import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import React from "react";
import { useColorScheme } from "react-native";

interface props {
  mapRef: React.RefObject<Mapbox.MapView>
  cameraRef: React.RefObject<Mapbox.MapView>
  useSatellite?: boolean
  zoomLevel: number
  pitch: number
}

export default function ThemedMap({ mapRef, cameraRef }: props) {
  const lightUrl = Constants.expoConfig?.extra?.lightMapUrl;
  const darkUrl = Constants.expoConfig?.extra?.darkMapUrl;
  const satelliteUrl = Constants.expoConfig?.extra?.satelliteUrl;
  const mode = useColorScheme();
  return (
    <Mapbox.MapView ref={mapRef}>

    </Mapbox.MapView>
  )
}