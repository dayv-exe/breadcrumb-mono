import axiosInstance from "@/constants/axios"
import { MediaType } from "@/constants/media"
import { AxiosError } from "axios"
import { apiResponse, extractBackendMsg } from "./models/apiResponse"

export type LocationTypes = "gps" | "friend-gps" | "label" | "dropped-pin"

type crumbMedia = {
  index: number
  media?: string
  type: MediaType
  overlay?: string
  thumbnail?: string
}

export type crumbBody = {
  id: string
  receivers: string[]
  lat: number
  lon: number
  locationAccuracy: number
  locationType: LocationTypes
  mediaItems: crumbMedia[]
  text?: crumbText[]
}

export type Crumb = {
  id: string
  sender: string
  receiver: string
  lat: number
  lon: number
  locationAccuracy: number
  locationType: LocationTypes
  placeId: string
  text?: crumbText[]
  media: crumbMedia[]
  geohash: string
  time: string
}

export type crumbText = {
  index: number
  content: string
}

export const getCrumbs = async (next?: string): Promise<apiResponse<Crumb[]>> => {
  let url = "/api/v1/crumbs"
  url += next ? `?next=${next}` : ""
  try {
    const { data } = await axiosInstance.get<{ message: Crumb[] }>(url)
    return { message: data.message, error: null }
  } catch (error) {
    console.log(extractBackendMsg(error))
    return { message: [], error: (error as AxiosError).message }
  }
}

export const shareCrumb = async (crumb: crumbBody): Promise<apiResponse<crumbBody[]>> => {
  try {
    const { data } = await axiosInstance.post<{ message: crumbBody[] }>(`/api/v1/crumbs`,
      {
        id: crumb.id,
        receivers: crumb.receivers,
        lat: crumb.lat,
        lon: crumb.lon,
        locationAccuracy: crumb.locationAccuracy,
        locationType: crumb.locationType,
        media: crumb.mediaItems,
        text: crumb.text
      })
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}