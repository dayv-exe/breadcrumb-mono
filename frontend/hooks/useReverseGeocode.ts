import { formatAddress } from "@/utils/locationFormatter";
import { Coordinates } from "@/utils/useLocationStore";
import * as Location from 'expo-location';
import { useEffect, useState } from "react";

type ReverseGeocodeType = {
  address: string | null
  setReverseGeocodeCoordinates: (c: Coordinates | null) => void
}

export function useReverseGeocode(): ReverseGeocodeType {
  const [address, setAddress] = useState<string | null>(null)
  const [coordinates, setReverseGeocodeCoordinates] = useState<Coordinates | null>(null)

  const locationKey = `${coordinates?.latitude},${coordinates?.longitude}`

  const reverseGeocode = async (coords: Coordinates) => {
    setAddress(null)
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (!result) return null;

      return formatAddress(result);
    } catch (err) {
      console.warn('Reverse-geocode failed:', err);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false

    if (!coordinates) {
      setAddress(null)
      return
    }

    reverseGeocode(coordinates).then((result) => {
      if (!cancelled) setAddress(result)
    })

    return () => { cancelled = true }
  }, [locationKey])

  return {
    address,
    setReverseGeocodeCoordinates
  }
}