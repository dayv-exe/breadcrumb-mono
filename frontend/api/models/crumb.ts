import { crumbMedia } from "./crumbMedia"
import { LocationSelectionManner } from "./locationTypes"

export type CrumbCaption = {
  index: number
  content: string
}

export type Crumb = {
  id: string
  nonCompositeId: string
  sender: string
  receiver: string
  latitude: number
  longitude: number
  radius: number
  locationSelectionManner: LocationSelectionManner
  placeId: string
  media: crumbMedia[]
  geohash: string
  time: string
  unlocked: boolean
  opened: boolean
  saved: boolean
  formattedAddress: string
  placename: string
  notificationMessage?: string
}

export type CrumbMailbox = "sent" | "received" | "saved"