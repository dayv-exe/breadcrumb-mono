import { getMapCamPosition, MapCamPosition } from "@/constants/mapFunctions";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import * as Haptics from "expo-haptics";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useRef, useState } from "react";

export type CustomMapHook = {
  selectedPoi: Feature<Geometry, GeoJsonProperties> | null
  setSelectedPoi: (p: Feature<Geometry, GeoJsonProperties> | null) => void
  droppedPin: [number, number] | null
  setDroppedPin: (p: [number, number] | null) => void
  droppedPinRadius: number
  setDroppedPinRadius: (r: number) => void
  focusOnCoords: (coords: [number, number], preLocationSelCamPos: MapCamPosition | null, allowPitching: boolean) => void
  focusOnPoi: (poi: Feature<Geometry, GeoJsonProperties> | null) => void
  focusOnDroppedPin: (c: [number, number]) => void
  focusOnSearchResult: (c: [number, number]) => void
  focusOnUserLocation: () => void
  is2dButtonVisible: boolean
  set2dButtonVisible: (s: boolean) => void
  lock2DButtonAsHidden: boolean
  allowAutoPitch: boolean
  setAllowAutoPitch: (s: boolean) => void
  make2d: () => void
  make3d: () => void
}

export const useMap = (
  mapRef: React.RefObject<Mapbox.MapView | null>,
  mapCameraRef: React.RefObject<Mapbox.Camera | null>,
  initialDroppedPin?: [number, number],
  initialDroppedPinRadius?: number,
  initialSelectedPoi?: Feature<Geometry, GeoJsonProperties>
): CustomMapHook => {
  const [selectedPoi, setSelectedPoi] = useState<Feature<Geometry, GeoJsonProperties> | null>(initialSelectedPoi ?? null)
  const [droppedPin, setDroppedPin] = useState<[number, number] | null>(initialDroppedPin ?? null)
  const [droppedPinRadius, setDroppedPinRadius] = useState<number>(initialDroppedPinRadius ?? 15)
  const [is2dButtonVisible, set2dButtonVisible] = useState(false)
  const [lock2DButtonAsHidden, setLock2DButtonAsHidden] = useState(false)
  const resetZoomOnUnselect = useRef(false)
  const preLocationSelectCamPos = useRef<Promise<MapCamPosition | null>>(null)
  const [allowAutoPitch, setAllowAutoPitch] = useState(true)
  const handleSavePreLocationSelectCameraPosition = (): Promise<MapCamPosition | null> => {
    const camPos = getMapCamPosition(mapRef)
    if (!selectedPoi && !droppedPin) {
      // zoom before location selection
      resetZoomOnUnselect.current = true
      preLocationSelectCamPos.current = camPos
    }
    return camPos
  }

  const setCameraFn = (config: Mapbox.CameraStop) => {
    if (!mapCameraRef?.current) return
    // if (!allowAutoPitch) config.pitch = undefined
    mapCameraRef.current.setCamera(config)
  }

  const focusOnCoords = async (coords: [number, number], preLocationSelCamPos: MapCamPosition | null, allowPitch: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCameraFn({
      centerCoordinate: coords,
      animationDuration: 400,
      animationMode: "easeTo",
      pitch: allowPitch ? 45 : undefined,
      zoomLevel: allowPitch ? Math.max(17, preLocationSelCamPos?.zoom ?? 0) : undefined
    })
  }

  const focusOnSearchResult = async (coords: [number, number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCameraFn({
      centerCoordinate: coords,
      animationDuration: 400,
      animationMode: "easeTo",
      zoomLevel: 17
    })
  }

  const focusOnPoi = async (poi: Feature<Geometry, GeoJsonProperties> | null) => {
    setDroppedPin(null)
    setSelectedPoi(poi)
    if (poi) {
      const camPos = handleSavePreLocationSelectCameraPosition()
      focusOnCoords((poi.geometry as any).coordinates as [number, number], (await camPos), false)
      console.log(poi)
      return;
    }
  }

  const focusOnDroppedPin = async (coords: [number, number]) => {
    const camPos = handleSavePreLocationSelectCameraPosition()
    focusOnCoords(coords, await camPos, true)
    setDroppedPin(coords)
    setSelectedPoi(null)
  }

  async function focusOnUserLocation() {
    const curCoord = useLocationStore.getState().coordinates
    mapCameraRef?.current?.setCamera({
      centerCoordinate: [curCoord?.longitude ?? 0, curCoord?.latitude ?? 0],
      zoomLevel: 12.6,
      animationDuration: 1000,
      pitch: 0,
      heading: 0,
    })
  }

  const make2d = () => {
    if (selectedPoi || droppedPin) {
      setAllowAutoPitch(false)
      set2dButtonVisible(false)
      // setLock2DButtonAsHidden(true)
    }
    mapCameraRef.current?.setCamera({
      pitch: 0,
      animationDuration: 300
    })
  }

  const make3d = () => {
    set2dButtonVisible(true)
    setLock2DButtonAsHidden(false)
    setAllowAutoPitch(true)
    mapCameraRef.current?.setCamera({
      pitch: 45,
      animationDuration: 300
    })
  }

  return {
    selectedPoi,
    setSelectedPoi,
    droppedPin,
    setDroppedPin,
    droppedPinRadius,
    setDroppedPinRadius,
    focusOnCoords,
    focusOnSearchResult,
    focusOnPoi,
    focusOnDroppedPin,
    focusOnUserLocation,
    is2dButtonVisible,
    set2dButtonVisible,
    lock2DButtonAsHidden,
    allowAutoPitch,
    setAllowAutoPitch,
    make2d,
    make3d,
  }
}