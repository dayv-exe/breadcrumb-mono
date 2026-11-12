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
  cachedCoordinate: Coordinates | null;
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
  INITIAL_FIX_ACCURACY: Location.Accuracy.Balanced,
  INITIAL_FIX_ATTEMPTS: 3,
  INITIAL_FIX_RETRY_DELAY_MS: 1000,
  WATCH_ACCURACY: Location.Accuracy.BestForNavigation,
  DISTANCE_INTERVAL_METRES: 10,
  STALE_REFRESH_MS: 60 * 1000,
} as const;

// Haversine distance in metres between two coordinates.
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

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Request foreground permission; throws on denial.
async function ensurePermission(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
}

async function enableHighAccuracyIfNeeded(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Location.enableNetworkProviderAsync();
  } catch {
    // User declined or API unavailable – GPS-only may still work.
  }
}

async function getInitialFix(
  shouldContinue: () => boolean,
): Promise<Location.LocationObject | null> {
  for (let attempt = 0; attempt < LOCATION_CONFIG.INITIAL_FIX_ATTEMPTS; attempt++) {
    if (!shouldContinue()) return null;
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: LOCATION_CONFIG.INITIAL_FIX_ACCURACY,
      });
    } catch {
      if (attempt < LOCATION_CONFIG.INITIAL_FIX_ATTEMPTS - 1) {
        await delay(LOCATION_CONFIG.INITIAL_FIX_RETRY_DELAY_MS);
      }
    }
  }
  if (!shouldContinue()) return null;
  try {
    return await Location.getLastKnownPositionAsync();
  } catch {
    return null;
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
      cachedCoordinate: null,
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

          const initial = await getInitialFix(isCurrent);
          if (!isCurrent()) return; 
          if (initial) {
            set({ coordinates: toCoordinates(initial), lastUpdated: Date.now() });
          }

          const sub = await Location.watchPositionAsync(
            {
              accuracy: LOCATION_CONFIG.WATCH_ACCURACY,
              distanceInterval: LOCATION_CONFIG.DISTANCE_INTERVAL_METRES,
            },
            (location) => {
              if (!isCurrent()) return;
              set({ coordinates: toCoordinates(location), lastUpdated: Date.now() });
            },
          );

          if (!isCurrent()) {
            sub.remove();
            return;
          }
          subscription = sub;

          let refreshing = false;
          staleTimer = setInterval(async () => {
            if (!isCurrent() || refreshing) return;
            const { coordinates, lastUpdated } = get();
            if (
              coordinates !== null &&
              lastUpdated !== null &&
              Date.now() - lastUpdated < LOCATION_CONFIG.STALE_REFRESH_MS
            ) {
              return;
            }
            refreshing = true;
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: LOCATION_CONFIG.WATCH_ACCURACY,
              });
              if (!isCurrent()) return;
              set({ coordinates: toCoordinates(location), lastUpdated: Date.now() });
            } catch {
            } finally {
              refreshing = false;
            }
          }, LOCATION_CONFIG.STALE_REFRESH_MS);

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
        generation++;
        teardownSession();
        set({ isTracking: false, isLoading: false });
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cachedCoordinate: state.coordinates ?? state.cachedCoordinate,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);

export function useInitializeLocationTracking(): void {
  const startTracking = useLocationStore((s) => s.startTracking);
  const stopTracking = useLocationStore((s) => s.stopTracking);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);
}