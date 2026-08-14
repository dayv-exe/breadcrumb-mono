import { SelectedLocation } from "@/api/models/locationTypes";
import { convertCoordinatesToNumberTuple, convertNumberTupleToCoordinates, getMapCamPosition, MapCamPosition } from "@/constants/mapFunctions";
import { Coordinates, useLocationStore } from "@/utils/useLocationStore";
import Mapbox from "@rnmapbox/maps";
import * as Haptics from "expo-haptics";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useRef, useState } from "react";

export type CustomMapHook = {
  selectedLocation: SelectedLocation | null,
  setDroppedPinRadius: (r: number) => void
  focusOnSelectedLocation: (l: SelectedLocation | null) => void,
  focusOnPoiLabel: (poi: Feature<Geometry, GeoJsonProperties> | null) => void
  focusOnDroppedPin: (coords: [number, number]) => void
  focusOnCrumbs: (crumbIds: string[], coordinates: Coordinates) => void
  focusOnSearchResult: (c: [number, number]) => void
  focusOnUserLocation: () => void
  focusOnCurrentCenterLocation: () => void
  clearSelectedLocation: () => void
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
      zoomLevel: allowPitch ? Math.max(16.5, preLocationSelCamPos?.zoom ?? 0) : undefined
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

  const focusOnSelectedLocation = async (selectedLocation: SelectedLocation | null) => {
    if (!selectedLocation) {
      setSelectedLocation(null)
      return
    }
    const camPos = handleSavePreLocationSelectCameraPosition()
    focusOnCoords(
      convertCoordinatesToNumberTuple(selectedLocation.coordinates),
      await camPos,
      selectedLocation.type === "pin",
    )
    setSelectedLocation(selectedLocation)
  }

  async function focusOnUserLocation() {
    setSelectedLocation(null)
    const curCoord = useLocationStore.getState().coordinates
    setCameraFn({
      centerCoordinate: [curCoord?.longitude ?? 0, curCoord?.latitude ?? 0],
      zoomLevel: 12.5,
      animationDuration: 1000,
      pitch: 0,
      heading: 0,
    })
  }

  async function focusOnCurrentCenterLocation() {
    setCameraFn({
      zoomLevel: 12.5,
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
    focusOnSelectedLocation,
    clearSelectedLocation: () => setSelectedLocation(null),
    setDroppedPinRadius: r => {
      if (selectedLocation && selectedLocation.type === "pin") {
        setSelectedLocation({ ...selectedLocation, radius: r })
      }
    },
    focusOnSearchResult,
    focusOnUserLocation,
    focusOnCurrentCenterLocation,
    focusOnCrumbs: (ids, coords) => {
      focusOnSelectedLocation({
        type: "crumb",
        coordinates: coords,
        crumbIds: ids
      })
    },
    focusOnDroppedPin: (coords) => {
      focusOnSelectedLocation({
        type: "pin",
        coordinates: convertNumberTupleToCoordinates(coords),
        radius: 15,
      })
    },
    focusOnPoiLabel: poi => {
      if (!poi) {
        focusOnSelectedLocation(null)
        return
      }
      focusOnSelectedLocation({
        type: "poi",
        coordinates: convertNumberTupleToCoordinates((poi?.geometry as any).coordinates as [number, number]),
        poi: poi
      })
    },
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