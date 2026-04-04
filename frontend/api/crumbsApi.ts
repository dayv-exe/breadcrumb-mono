import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"

type crumbMedia = {
  index: number
  media: string
  overlay?: string
  thumbnail?: string
}

export type crumbBody = {
  id: string
  receivers: string[]
  lat: number
  lon: number
  locationAccuracy: number
  locationType: "mine" | "friend" | "map"
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
  locationType: "mine" | "friend" | "map"
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

export const getCrumbs = async (from: string): Promise<apiResponse<Crumb[]>> => {
  try {
    const { data } = await axiosInstance.get<{ message: Crumb[] }>(`/api/v1/crumbs/sent`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).name)
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