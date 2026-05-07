import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse, extractBackendMsg } from "./models/apiResponse"
import { Crumb, CrumbIdPrefix, CrumbReceiverPrefix, CrumbSenderPrefix, CrumbTimePrefix } from "./models/crumb"
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

export const getLatestCrumbs = async (sentCrumbs: boolean, userId?: string, crumbId?: string, lastTimeStamp?: string): Promise<apiResponse<Crumb[]>> => {
  let url = `/api/v1/crumbs`
  if (userId) {
    userId = sentCrumbs ? CrumbSenderPrefix + userId : CrumbReceiverPrefix + userId
    lastTimeStamp = CrumbTimePrefix + lastTimeStamp + CrumbIdPrefix + crumbId
    url += `?pk=${userId}&sk=${lastTimeStamp}&sent=${sentCrumbs}`
  }
  try {
    const { data } = await axiosInstance.get<{ message: Crumb[] }>(url)
    return { message: data.message, error: null }
  } catch (error) {
    console.error(extractBackendMsg(error))
    return { message: [], error: (error as AxiosError).message }
  }
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