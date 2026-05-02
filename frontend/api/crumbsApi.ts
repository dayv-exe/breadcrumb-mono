import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { UpsertCrumbs } from "./db/crumbsDb"
import { apiResponse, extractBackendMsg } from "./models/apiResponse"
import { Crumb } from "./models/crumb"
import { crumbMedia } from "./models/crumbMedia"
import { crumbText } from "./models/crumbText"
import { LocationTypes } from "./models/locationTypes"



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

export const getCrumbs = async (next?: string): Promise<apiResponse<Crumb[]>> => {
  let url = "/api/v1/crumbs"
  url += next ? `?next=${next}` : ""
  try {
    const { data } = await axiosInstance.get<{ message: Crumb[] }>(url)
    UpsertCrumbs(data.message)
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