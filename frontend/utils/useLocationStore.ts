import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { formatAddress } from './locationFormatter';

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
  lastGeocodedCoords: Coordinates | null;
}

interface LocationActions {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  reverseGeocode: (coords: Coordinates) => Promise<string | null>;
  setError: (error: string | null) => void;
}

const LOCATION_CONFIG = {
  ACCURACY: Location.Accuracy.BestForNavigation,
  DISTANCE_INTERVAL: 10,
  TIME_INTERVAL: 15_000,
  GEOCODE_DISTANCE_THRESHOLD: 25,
} as const;

/** Haversine distance in metres between two coordinates. */
function distanceMetres(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000; // Earth radius in metres
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinHalf = (x: number) => Math.sin(x / 2);
  const h =
    sinHalf(dLat) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinHalf(dLon) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Request foreground permission once; throws on denial. */
async function ensurePermission(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
}

/**
 * On Android, prompt the user to enable the network/GPS provider if it's off.
 * This is a no-op on iOS.
 */
async function enableHighAccuracyIfNeeded(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // User declined or API unavailable – we can still try with GPS-only.
    }
  }
}

/** Fetch current position once and return normalised Coordinates. */
async function fetchCurrentPosition(): Promise<Coordinates> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: LOCATION_CONFIG.ACCURACY,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}

let locationSubscription: Location.LocationSubscription | null = null;

export const useLocationStore = create<LocationState & LocationActions>()(
  persist(
    (set, get) => ({
      // -- state --
      coordinates: null,
      address: null,
      isLoading: false,
      error: null,
      isTracking: false,
      lastUpdated: null,
      lastGeocodedCoords: null,

      // -- actions --

      setError: (error) => set({ error }),

      reverseGeocode: async (coords) => {
        try {
          const [result] = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });

          if (!result) return null;

          const address = formatAddress(result);
          set({lastGeocodedCoords: coords });
          return address;
        } catch (err) {
          console.warn('Reverse-geocode failed:', err);
          return null;
        }
      },

      startTracking: async () => {
        if (get().isTracking) return;

        set({ isLoading: true, error: null });

        try {
          await ensurePermission();
          await enableHighAccuracyIfNeeded();

          // Single location fetch for both coords and address.
          const coords = await fetchCurrentPosition();

          set({
            coordinates: coords,
            isLoading: false,
            isTracking: true,
            lastUpdated: Date.now(),
            lastGeocodedCoords: coords,
          });

          // Begin watching.
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: LOCATION_CONFIG.ACCURACY,
              distanceInterval: LOCATION_CONFIG.DISTANCE_INTERVAL,
              timeInterval: LOCATION_CONFIG.TIME_INTERVAL,
            },
            async (location) => {
              const newCoords: Coordinates = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
              };

              const { lastGeocodedCoords } = get();

              // Always update coordinates so the map / UI stays fresh.
              set({ coordinates: newCoords, lastUpdated: Date.now() });
            },
          );
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start tracking',
            isLoading: false,
            isTracking: false,
          });
        }
      },

      stopTracking: () => {
        if (locationSubscription) {
          locationSubscription.remove();
          locationSubscription = null;
        }
        set({ isTracking: false });
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

export function useInitializeLocationTracking() {
  const startTracking = useLocationStore((s) => s.startTracking);
  const stopTracking = useLocationStore((s) => s.stopTracking);

  // Ref guards against React 18 Strict Mode double-invoking the effect.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    startTracking();

    return () => {
      stopTracking();
      started.current = false;
    };
  }, [startTracking, stopTracking]);
}