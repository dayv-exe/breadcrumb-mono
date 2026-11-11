import axiosInstance from "@/constants/axios"
import { upsertCrumbs } from "./db/crumbsDb"
import { Crumb } from "./models/crumb"
import { CrumbMarkerDetails } from "./models/CrumbMarkerDetails"
import { LocationSelectionManner } from "./models/locationTypes"
import { Media } from "./models/media"



export type crumbBody = {
  nonCompositeId: string
  receivers: string[]
  latitude: number
  longitude: number
  radius: number
  locationSelectionManner: LocationSelectionManner
  media: Media[]
  clickedFeatureId?: string
  address?: string
}

type CrumbsResponse = {
  message: Crumb[]
  next?: string
}

export type CrumbsPage = {
  crumbs: Crumb[]
  next?: string
}

export const getLatestCrumbs = async (userid: string, lastCrumb: Crumb | null): Promise<CrumbsPage> => {
  const otherUser = lastCrumb ? userid === lastCrumb?.sender ? lastCrumb?.receiver : lastCrumb?.sender : undefined
  let url = `/crumbs${lastCrumb?.id ? `?id=${lastCrumb.id}` : ""}${otherUser ? `&otherUser=${otherUser}` : ""}${lastCrumb?.time ? `&time=${lastCrumb.time}` : ""}`
  const { data } = await axiosInstance.get<CrumbsResponse>(url)
  upsertCrumbs(data.message)
  return { crumbs: data.message, next: data.next }
}

export const getCrumbMarkers = async (ids: string[]): Promise<CrumbMarkerDetails[]> => {
  const { data } = await axiosInstance.post<{ message: CrumbMarkerDetails[] }>("/crumbs/markers", { ids: ids })
  return data.message
}

export const uploadCrumbMetadata = async (crumb: crumbBody): Promise<crumbBody[]> => {
  const { data } = await axiosInstance.post(`/crumbs`, crumb)
  return data.message
}

export const openCrumb = async (crumbId: string): Promise<Media[]> => {
  const { data } = await axiosInstance.get<{ message: Media[] }>(`/crumbs/${crumbId}/open`)
  return data.message
}