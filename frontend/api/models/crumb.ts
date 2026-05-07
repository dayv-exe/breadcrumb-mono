import { crumbMedia } from "./crumbMedia"
import { crumbText } from "./crumbText"
import { LocationTypes } from "./locationTypes"

export const CrumbPkPrefix = "CRUMB_RECEIVER#"
export const CrumbReceiverPrefix = "CRUMB_RECEIVER#"
export const CrumbSenderPrefix = "CRUMB_SENDER#"
export const CrumbIdPrefix = "CRUMB_ID#"
export const CrumbTimePrefix = "TS#"
export const CrumbGeohashPrefix = "GEOHASH#"

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
  opened: boolean
}