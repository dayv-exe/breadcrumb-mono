import { crumbMedia } from "./crumbMedia"
import { crumbText } from "./crumbText"
import { LocationTypes } from "./locationTypes"

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