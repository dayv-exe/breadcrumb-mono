import { getNearbyPlaces } from "@/api/getNearbyPlacesApi";
import { useQuery } from "@tanstack/react-query";

export const useGetNearbyPlaces = (lat: number, lon: number, radius: number) => useQuery({
  queryKey: ['nearby-places'],
  queryFn: () => getNearbyPlaces(lat, lon, radius)
})