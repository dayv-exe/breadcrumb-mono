import { retrievePlace, searchPlace } from "@/api/placeSearchApi";
import { TIME } from "@/constants/appConstants";
import { Coordinates } from "@/utils/useLocationStore";
import { useQuery } from "@tanstack/react-query";

export const useSearchPlace = (sessionToken: string, query: string, mapCenter: Coordinates, userLocation: Coordinates) => useQuery({
  queryFn: () => searchPlace(sessionToken, query, mapCenter, userLocation),
  queryKey: ["place-search", query],
  enabled: sessionToken.length > 0 && query.length > 0,
  staleTime: 10 * TIME.MINUTE
})

export const useRetrievePlace = (sessionToken: string, placeId: string, userLocation: Coordinates) => useQuery({
  queryFn: () => retrievePlace(sessionToken, placeId, userLocation),
  queryKey: ["place-retrieve", placeId],
  enabled: sessionToken.length > 0 && placeId.length > 0,
  staleTime: 10 * TIME.MINUTE
})