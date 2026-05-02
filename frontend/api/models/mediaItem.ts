import { MediaType } from "@/constants/media"
import { crumbText } from "./crumbText"

export type MediaItem = {
  index: number
  media: string
  overlay?: string
  thumbnail?: string
  text?: crumbText
  type: MediaType
}