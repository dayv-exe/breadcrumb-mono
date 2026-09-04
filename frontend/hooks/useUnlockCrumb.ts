import { unlockNearbyCrumbsByDistance, unlockNearbyCrumbsByPlace } from "@/api/db/crumbsDb";
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
    async function unlock() {
      if (coordinates) {
        const distanceUnlockedCrumbs = await unlockNearbyCrumbsByDistance(coordinates.latitude, coordinates.longitude, coordinates.accuracy ?? 0)
        if (distanceUnlockedCrumbs.length > 0) {
          console.log("distance: ", distanceUnlockedCrumbs)
        }
      }

      if (nearbyPlaces) {
        const placeIdUnlockedCrumbs = await unlockNearbyCrumbsByPlace(nearbyPlaces)
        if (placeIdUnlockedCrumbs.length > 0) {
          console.log("place: ", placeIdUnlockedCrumbs)
        }
      }
    }

    unlock()
  }, [coordinates, nearbyPlaces, nearbyPlacesError, version])

  return null
}