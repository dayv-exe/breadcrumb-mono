import axiosInstance from "@/constants/axios"
import { Coordinates } from "@/utils/useLocationStore"
import { AxiosError } from "axios"
import { apiResponse, extractBackendMsg } from "./models/apiResponse"
import { RetrieveResponse, SuggestResponse } from "./models/placeSearch"

export const searchPlace = async (sessionToken: string, query: string, mapCenter: Coordinates, userLocation: Coordinates): Promise<apiResponse<SuggestResponse | null>> => {
  try {
    const { data } = await axiosInstance.post<{ message: SuggestResponse }>(`/api/v1/search/${query}?place=true`, {
      origin: { lat: userLocation.latitude, lon: userLocation.longitude },
      proximity: { lat: mapCenter.latitude, lon: mapCenter.longitude },
      sessionToken: sessionToken
    })
    return { message: data.message, error: null }
  } catch (error) {
    console.log(extractBackendMsg(error))
    return { message: null, error: (error as AxiosError).message }
  }
}

export const retrievePlace = async (sessionToken: string, placeId: string, userLocation: Coordinates): Promise<apiResponse<RetrieveResponse | null>> => {
  try {
    const { data } = await axiosInstance.post<{ message: RetrieveResponse }>(`/api/v1/search/${placeId}?retrieve=true`, {
      origin: { lat: userLocation.latitude, lon: userLocation.longitude },
      sessionToken: sessionToken
    })
    return { message: data.message, error: null }
  } catch (error) {
    console.log(extractBackendMsg(error))
    return { message: null, error: (error as AxiosError).message }
  }
}