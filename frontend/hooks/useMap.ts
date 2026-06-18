import { SelectedLocation } from "@/api/models/locationTypes";
import { convertNumberTupleToCoordinates, extractPoiCoordinates, getMapCamPosition, MapCamPosition } from "@/constants/mapFunctions";
import { useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import * as Haptics from "expo-haptics";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useRef, useState } from "react";

export type CustomMapHook = {
  selectedLocation: SelectedLocation | null,
  setDroppedPinRadius: (r: number) => void
  setSelectedLocation: (l: SelectedLocation | null) => void
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
  useSatellite: boolean
  setUseSatellite: (s: boolean) => void
}

export const useMap = (
  mapRef: React.RefObject<Mapbox.MapView | null>,
  mapCameraRef: React.RefObject<Mapbox.Camera | null>,
  initialSelectedLocation: SelectedLocation | null
): CustomMapHook => {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(initialSelectedLocation)
  const [is2dButtonVisible, set2dButtonVisible] = useState(false)
  const [lock2DButtonAsHidden, setLock2DButtonAsHidden] = useState(false)
  const resetZoomOnUnselect = useRef(false)
  const preLocationSelectCamPos = useRef<Promise<MapCamPosition | null>>(null)
  const [allowAutoPitch, setAllowAutoPitch] = useState(true)
  const [useSatellite, setUseSatellite] = useState(false)
  const handleSavePreLocationSelectCameraPosition = (): Promise<MapCamPosition | null> => {
    const camPos = getMapCamPosition(mapRef)
    if (!selectedLocation) {
      // zoom before location selection
      resetZoomOnUnselect.current = true
      preLocationSelectCamPos.current = camPos
    }
    return camPos
  }

  useEffect(() => {
    if (useSatellite) {
      mapCameraRef.current?.setCamera({
        pitch: 0,
        animationDuration: 0,
      })
    }
  }, [useSatellite])

  const setCameraFn = (config: Mapbox.CameraStop) => {
    if (!mapCameraRef?.current) return
    // if (!allowAutoPitch) config.pitch = undefined
    if (useSatellite) config.pitch = 0
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
    if (!poi) {
      setSelectedLocation(null)
    } else {
      console.log(poi)
      setSelectedLocation({
        type: "poi",
        coordinates: extractPoiCoordinates(poi),
        poi: poi,
      })
    }
    if (poi) {
      const camPos = handleSavePreLocationSelectCameraPosition()
      focusOnCoords((poi.geometry as any).coordinates as [number, number], (await camPos), false)
      return;
    }
  }

  const focusOnDroppedPin = async (coords: [number, number]) => {
    const camPos = handleSavePreLocationSelectCameraPosition()
    focusOnCoords(coords, await camPos, true)
    setSelectedLocation({
      type: "pin",
      coordinates: convertNumberTupleToCoordinates(coords),
      radius: 15,
    })
  }

  async function focusOnUserLocation() {
    setSelectedLocation(null)
    const curCoord = useLocationStore.getState().coordinates
    setCameraFn({
      centerCoordinate: [curCoord?.longitude ?? 0, curCoord?.latitude ?? 0],
      zoomLevel: 12.6,
      animationDuration: 1000,
      pitch: 0,
      heading: 0,
    })
  }

  const make2d = () => {
    if (selectedLocation) {
      setAllowAutoPitch(false)
      set2dButtonVisible(false)
      // setLock2DButtonAsHidden(true)
    }
    setCameraFn({
      pitch: 0,
      animationDuration: 300
    })
  }

  const make3d = () => {
    set2dButtonVisible(true)
    setLock2DButtonAsHidden(false)
    setAllowAutoPitch(true)
    setCameraFn({
      pitch: 45,
      animationDuration: 300
    })
  }

  return {
    selectedLocation,
    setSelectedLocation,
    setDroppedPinRadius: r => {
      if (selectedLocation && selectedLocation.type === "pin") {
        setSelectedLocation({ ...selectedLocation, radius: r })
      }
    },
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
    useSatellite,
    setUseSatellite
  }
}