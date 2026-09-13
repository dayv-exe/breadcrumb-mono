
import { useLocationStore } from "@/utils/useLocationStore";
import { useEffect } from "react";
import { useGetNearbyPlaces } from "./queries/useGetNearbyPlacesApi";
import { useWatchDbChanges } from "./useWatchDbChanges";

const WATCHED_TABLES = new Set(["crumbs", "places"]);

export function useUnlockCrumb() {
  const coordinates = useLocationStore(s => s.coordinates)
  const { data: nearbyPlaces, error: nearbyPlacesError } = useGetNearbyPlaces(
    coordinates?.latitude ?? 0,
    coordinates?.longitude ?? 0,
    coordinates?.accuracy ?? 0
  )
  const { version } = useWatchDbChanges({
    watchedTables: WATCHED_TABLES
  })

  useEffect(() => {

  }, [])

  return null
}