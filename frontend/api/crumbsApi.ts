import axiosInstance from "@/constants/axios"
import { UpsertCrumbs } from "./db/crumbsDb"
import { Crumb } from "./models/crumb"
import { CrumbMarkerDetails } from "./models/CrumbMarkerDetails"
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
  clickedFeatureId?: string
}

type CrumbsResponse = {
  message: Crumb[]
  next?: string
}

type CrumbsPage = {
  crumbs: Crumb[]
  next?: string
}

export const getLatestCrumbs = async (sentCrumbs: boolean, crumbId?: string, lastTimeStamp?: string): Promise<CrumbsPage> => {
  let url = `/crumbs`
  if (crumbId) {
    url += `?crumbId=${crumbId}&time=${lastTimeStamp}&sent=${sentCrumbs}`
  }
  const { data } = await axiosInstance.get<CrumbsResponse>(url)
  UpsertCrumbs(data.message)
  return { crumbs: data.message, next: data.next }
}

export const getCrumbs = async (next?: string): Promise<CrumbsPage> => {
  const url = next ? `/crumbs?next=${encodeURIComponent(next)}` : "/crumbs"
  const { data } = await axiosInstance.get<CrumbsResponse>(url)
  return { crumbs: data.message, next: data.next }
}

export const getCrumbMarkers = async (): Promise<CrumbMarkerDetails[]> => {
  const { data } = await axiosInstance.get<{ message: CrumbMarkerDetails[] }>("/crumbs/markers")
  return data.message
}

export const shareCrumb = async (crumb: crumbBody): Promise<crumbBody[]> => {
  const { data } = await axiosInstance.post(`/crumbs`, crumb)
  return data.message
}