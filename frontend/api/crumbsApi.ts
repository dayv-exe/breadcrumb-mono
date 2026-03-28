import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { PresignedMediaItem } from "./getPresignedUrl"
import { apiResponse } from "./models/apiResponse"

export type crumb = {
  id: string
  receivers: string[]
  lat: string
  lon: string
  locationAccuracy: number
  locationType: "mine" | "friend" | "map"
  mediaItems: PresignedMediaItem[]
}

export const getCrumbs = async (from: string): Promise<apiResponse<crumb[]>> => {
  try {
    const { data } = await axiosInstance.get<{ message: crumb[] }>(`/crumbs` + from ? `?sender=${from}` : "")
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const shareCrumb = async (crumb: crumb): Promise<apiResponse<crumb[]>> => {
  try {
    const { data } = await axiosInstance.post<{ message: crumb[] }>(`/crumbs`,
      {
        id: crumb.id,
        receivers: crumb.receivers,
        lat: crumb.lat,
        lon: crumb.lon,
        locationAccuracy: crumb.locationAccuracy,
        locationType: crumb.locationType,
        mediaKeys: crumb.mediaItems,
      })
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}