import { formatAddress } from "@/utils/locationFormatter";
import { Coordinates } from "@/utils/useLocationStore";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

type ReverseGeocodeType = {
  address: string | null;
  setReverseGeocodeCoordinates: (c: Coordinates | null) => void;
};

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return result ? formatAddress(result) : null;
  } catch (err) {
    console.warn("Reverse-geocode failed:", err);
    return null;
  }
}

const keyFor = (lat: number, lng: number) => `${lat},${lng}`;

export function useReverseGeocode(): ReverseGeocodeType {
  const [coordinates, setReverseGeocodeCoordinates] = useState<Coordinates | null>(null);
  const [result, setResult] = useState<{ key: string; address: string | null } | null>(null);

  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  const currentKey =
    latitude != null && longitude != null ? keyFor(latitude, longitude) : null;

  useEffect(() => {
    if (latitude == null || longitude == null) return;

    let cancelled = false;
    reverseGeocode(latitude, longitude).then((address) => {
      if (!cancelled) setResult({ key: keyFor(latitude, longitude), address });
    });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const address = currentKey !== null && result?.key === currentKey ? result.address : null;

  return { address, setReverseGeocodeCoordinates };
}