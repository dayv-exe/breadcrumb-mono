import { Coordinates } from "@/utils/useLocationStore"
import type { Feature, GeoJsonProperties, Geometry } from "geojson"

export type LocationSelectionManner = "gps" | "label" | "dropped-pin"
type PoiLocation = {
  type: "poi"
  poi: Feature<Geometry, GeoJsonProperties>
  coordinates: Coordinates
}

type DroppedPinLocation = {
  type: "pin"
  coordinates: Coordinates
  radius: number
}

type CrumbLocation = {
  type: "crumb"
  crumbIds: string[]
  coordinates: Coordinates
}

export type SelectedLocation = PoiLocation | DroppedPinLocation | CrumbLocation