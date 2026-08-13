import { useLocationStore } from "@/utils/useLocationStore";
import { useEffect } from "react";
import { useReverseGeocode } from "./useReverseGeocode";

type GetAddress = {
  address: string | null
}

export function UseGetAddress(): GetAddress {
  const {
    address,
    setReverseGeocodeCoordinates,
  } = useReverseGeocode()

  useEffect(() => {
    const coords = useLocationStore.getState().coordinates
    setReverseGeocodeCoordinates(coords)
  }, [])

  return {
    address
  }
}