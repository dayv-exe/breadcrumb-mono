import { reconcileCrumbLocks } from "@/api/db/crumbsDb";
import { getNearbyPlaces } from "@/api/getNearbyPlacesApi";
import { useLocationStore } from "@/utils/useLocationStore";
import { useEffect, useState } from "react";
import { useWatchDbChanges } from "./useWatchDbChanges";

const WATCHED_TABLES = new Set(["crumbs", "places"]);

type Coordinates = NonNullable<ReturnType<typeof useLocationStore.getState>["coordinates"]>;

export function useUnlockCrumb() {
  const { version } = useWatchDbChanges({ watchedTables: WATCHED_TABLES });
  const coordinates = useLocationStore(s => s.coordinates);
  const [fetched, setFetched] = useState<{ for: Coordinates; places: string[] } | null>(null);

  // Only use places fetched for the current coordinates
  const nearbyPlaces = fetched && fetched.for === coordinates ? fetched.places : undefined;

  // Fetch nearby places in the background; setState only happens in the async callback
  useEffect(() => {
    if (!coordinates) return;

    let cancelled = false;

    getNearbyPlaces(coordinates.latitude, coordinates.longitude, coordinates.accuracy ?? 0)
      .then(places => {
        if (!cancelled) setFetched({ for: coordinates, places });
      })
      .catch(err => {
        if (!cancelled) console.warn("Failed to fetch nearby places", err);
      });

    return () => {
      cancelled = true;
    };
  }, [coordinates]);

  // Reconcile immediately, and again when nearby places arrive or the DB changes
  useEffect(() => {
    if (coordinates) {
      reconcileCrumbLocks(coordinates, nearbyPlaces);
    }
  }, [coordinates, version, nearbyPlaces]);

  return null;
}