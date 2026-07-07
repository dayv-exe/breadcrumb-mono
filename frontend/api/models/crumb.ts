import { crumbMedia } from "./crumbMedia"
import { crumbText } from "./crumbText"
import { LocationSelectionManner } from "./locationTypes"

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
  text?: crumbText[]
  media: crumbMedia[]
  geohash: string
  time: string
  unlocked: boolean
  saved: boolean
  formattedAddress: string
  placename: string
}

export type CrumbMailbox = "sent" | "received" | "saved"