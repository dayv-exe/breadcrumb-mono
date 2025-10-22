import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { formatAddress } from './locationFormatter';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coordinates: Coordinates | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  isTracking: boolean;
  lastUpdated: number | null;
}

interface LocationActions {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCleanAddress: (coords?: Coordinates) => Promise<string | null>;
  getCoordinates: () => Promise<Coordinates>;
  setCoordinates: (coords: Coordinates) => void;
  setAddress: (address: string | null) => void;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const LOCATION_CONFIG = {
  ACCURACY: Location.Accuracy.BestForNavigation,
  DISTANCE_INTERVAL: 20,
  TIME_INTERVAL: 15000,
} as const;

let locationSubscription: Location.LocationSubscription | null = null;

export const useLocationStore = create<LocationState & LocationActions>()(
  persist(
    (set, get) => ({
      coordinates: null,
      address: null,
      isLoading: false,
      error: null,
      isTracking: false,
      lastUpdated: null,

      setCoordinates: (coords) => set({ coordinates: coords, lastUpdated: Date.now() }),
      setAddress: (address) => set({ address }),
      setError: (error) => set({ error }),
      setIsLoading: (isLoading) => set({ isLoading }),

      getCoordinates: async (): Promise<Coordinates> => {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: LOCATION_CONFIG.ACCURACY,
        });

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      },

      getCleanAddress: async (coords?: Coordinates): Promise<string | null> => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();

          if (status !== 'granted') {
            throw new Error('Location permission denied');
          }

          let latitude: number;
          let longitude: number;

          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          } else {
            const position = await Location.getCurrentPositionAsync({
              accuracy: LOCATION_CONFIG.ACCURACY,
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
          }

          const [location] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (!location) {
            console.error('Unable to fetch location!');
            return null;
          }

          let cleanAddress = formatAddress(location)
          console.log(location)
          return cleanAddress;
        } catch (error) {
          console.error('Error getting clean address:', error);
          return null;
        }
      },

      startTracking: async () => {
        const state = get();
        if (state.isTracking) {
          console.log('Already tracking location');
          return;
        }

        try {
          set({ isLoading: true, error: null });

          const { status } = await Location.requestForegroundPermissionsAsync();

          if (status !== 'granted') {
            set({
              error: 'Location permission denied',
              isLoading: false,
            });
            return;
          }

          const initialCoords = await get().getCoordinates();
          const initialAddress = await get().getCleanAddress(initialCoords);

          set({
            coordinates: initialCoords,
            address: initialAddress,
            isLoading: false,
            isTracking: true,
            lastUpdated: Date.now(),
          });

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
              };

              const newAddress = await get().getCleanAddress(newCoords);

              set({
                coordinates: newCoords,
                address: newAddress,
                lastUpdated: Date.now(),
              });
              console.log(newAddress)
            }
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
      // Only persist certain fields
      partialize: (state) => ({
        coordinates: state.coordinates,
        address: state.address,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

export const useInitializeLocationTracking = () => {
  const { startTracking, stopTracking, isTracking } = useLocationStore();

  useEffect(() => {
    if (!isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, []);
};