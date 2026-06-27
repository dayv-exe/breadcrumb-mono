import axiosInstance from "@/constants/axios"
import { UpsertCrumbs } from "./db/crumbsDb"
import { Crumb, CrumbMailbox } from "./models/crumb"
import { CrumbMarkerDetails } from "./models/CrumbMarkerDetails"
import { crumbMedia } from "./models/crumbMedia"
import { crumbText } from "./models/crumbText"
import { LocationSelectionManner } from "./models/locationTypes"



export type crumbBody = {
  id: string
  receivers: string[]
  latitude: number
  longitude: number
  radius: number
  locationSelectionManner: LocationSelectionManner
  mediaItems: crumbMedia[]
  text?: crumbText[]
  clickedFeatureId?: string
  address?: string
}

type CrumbsResponse = {
  message: Crumb[]
  next?: string
}

type CrumbsPage = {
  crumbs: Crumb[]
  next?: string
}

export const getLatestCrumbs = async (mailbox: CrumbMailbox, lastCrumb: Crumb | null): Promise<CrumbsPage> => {
  let url = `/crumbs?mailbox=${mailbox}
  ${lastCrumb?.id ? `&crumbId=${lastCrumb.id}` : ""}
  ${lastCrumb?.receiver ? `&receiver=${lastCrumb.receiver}` : ""}
  ${lastCrumb?.time ? `&time=${lastCrumb.time}` : ""}`
  const { data } = await axiosInstance.get<CrumbsResponse>(url)
  UpsertCrumbs(data.message)
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