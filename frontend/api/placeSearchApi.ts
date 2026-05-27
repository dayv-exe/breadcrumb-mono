import axiosInstance from "@/constants/axios"
import { Coordinates } from "@/utils/useLocationStore"
import { RetrieveResponse, SuggestResponse } from "./models/placeSearch"

export const searchPlace = async (sessionToken: string, query: string, mapCenter: Coordinates | null, userLocation: Coordinates): Promise<SuggestResponse> => {
  const { data } = await axiosInstance.post<{ message: SuggestResponse, error: string }>(`/search/${query}?place=true`, {
    origin: { lat: userLocation.latitude, lon: userLocation.longitude },
    proximity: { lat: mapCenter!.latitude, lon: mapCenter!.longitude },
    sessionToken: sessionToken
  })

  return data.message
}

export const retrievePlace = async (sessionToken: string, placeId: string, userLocation: Coordinates): Promise<RetrieveResponse> => {
  const { data } = await axiosInstance.post<{ message: RetrieveResponse }>(`/search/${placeId}?retrieve=true`, {
    origin: { lat: userLocation.latitude, lon: userLocation.longitude },
    sessionToken: sessionToken
  })

  return data.message
}