import { TIME } from '@/constants/appConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface LocationState {
  coordinates: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  isTracking: boolean;
  lastUpdated: number | null;
}

interface LocationActions {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  setError: (error: string | null) => void;
}

const LOCATION_CONFIG = {
  ACCURACY: Location.Accuracy.BestForNavigation,
  /** Watch fires when the device moves at least this far (metres). */
  DISTANCE_INTERVAL_METRES: 10,
  /**
   * The watch is distance-driven, so a stationary user produces no updates.
   * If nothing has arrived for this long, we actively fetch a fresh fix so
   * `lastUpdated` never goes stale. This gives "25 m OR 60 s" semantics,
   * which the OS options alone cannot express.
   */
  STALE_REFRESH_MS: 1 * TIME.HOUR,
} as const;

/** Haversine distance in metres between two coordinates. */
export function distanceMetres(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinHalf = (x: number) => Math.sin(x / 2);
  const h =
    sinHalf(dLat) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinHalf(dLon) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toCoordinates(location: Location.LocationObject): Coordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}

/** Request foreground permission; throws on denial. */
async function ensurePermission(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
}

/**
 * On Android, prompt the user to enable the network/GPS provider if it's off.
 * No-op on iOS.
 */
async function enableHighAccuracyIfNeeded(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Location.enableNetworkProviderAsync();
  } catch {
    // User declined or API unavailable – GPS-only may still work.
  }
}

// ---------------------------------------------------------------------------
// Tracking session
//
// The subscription and timer live outside the store (they aren't serialisable
// state). A generation counter makes start/stop race-safe: every start bumps
// the generation, every async continuation checks it still owns the current
// generation before touching the store, and stop simply bumps it again so any
// in-flight start becomes a no-op.
// ---------------------------------------------------------------------------

let generation = 0;
let subscription: Location.LocationSubscription | null = null;
let staleTimer: ReturnType<typeof setInterval> | null = null;

function teardownSession(): void {
  subscription?.remove();
  subscription = null;
  if (staleTimer !== null) {
    clearInterval(staleTimer);
    staleTimer = null;
  }
}

export const useLocationStore = create<LocationState & LocationActions>()(
  persist(
    (set, get) => ({
      // -- state --
      coordinates: null,
      isLoading: false,
      error: null,
      isTracking: false,
      lastUpdated: null,

      // -- actions --

      setError: (error) => set({ error }),

      startTracking: async () => {
        if (get().isTracking || get().isLoading) return;

        const session = ++generation;
        const isCurrent = () => session === generation;

        set({ isLoading: true, error: null });

        try {
          await ensurePermission();
          await enableHighAccuracyIfNeeded();

          // Immediate fix so the UI has something before the watch warms up.
          const initial = await Location.getCurrentPositionAsync({
            accuracy: LOCATION_CONFIG.ACCURACY,
          });
          if (!isCurrent()) return; // stopped while we were starting
          set({ coordinates: toCoordinates(initial), lastUpdated: Date.now() });

          const sub = await Location.watchPositionAsync(
            {
              accuracy: LOCATION_CONFIG.ACCURACY,
              distanceInterval: LOCATION_CONFIG.DISTANCE_INTERVAL_METRES,
            },
            (location) => {
              if (!isCurrent()) return;
              set({ coordinates: toCoordinates(location), lastUpdated: Date.now() });
            },
          );

          if (!isCurrent()) {
            // stopTracking ran while watchPositionAsync was resolving.
            sub.remove();
            return;
          }
          subscription = sub;

          // Fallback: refresh if the (distance-driven) watch goes quiet.
          staleTimer = setInterval(async () => {
            if (!isCurrent()) return;
            const { lastUpdated } = get();
            if (
              lastUpdated !== null &&
              Date.now() - lastUpdated < LOCATION_CONFIG.STALE_REFRESH_MS
            ) {
              return;
            }
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: LOCATION_CONFIG.ACCURACY,
              });
              if (!isCurrent()) return;
              set({ coordinates: toCoordinates(location), lastUpdated: Date.now() });
            } catch {
              // Transient failure – the next tick will retry.
            }
          }, LOCATION_CONFIG.STALE_REFRESH_MS);

          // Only now is tracking genuinely live.
          set({ isTracking: true, isLoading: false });
        } catch (error) {
          if (!isCurrent()) return;
          teardownSession();
          set({
            error: error instanceof Error ? error.message : 'Failed to start tracking',
            isLoading: false,
            isTracking: false,
          });
        }
      },

      stopTracking: () => {
        generation++; // invalidates any in-flight startTracking
        teardownSession();
        set({ isTracking: false, isLoading: false });
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        coordinates: state.coordinates,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);

/**
 * Starts tracking on mount and stops on unmount.
 *
 * Safe under React 18 Strict Mode without a ref guard: the double
 * mount/unmount cycle just bumps the session generation, and the final
 * mount's start wins.
 */
export function useInitializeLocationTracking(): void {
  const startTracking = useLocationStore((s) => s.startTracking);
  const stopTracking = useLocationStore((s) => s.stopTracking);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);
}