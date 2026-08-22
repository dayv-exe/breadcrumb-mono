import { MediaType } from "@/constants/media"

export type crumbMedia = {
  index: number
  media?: string
  type: MediaType
  thumbnail?: string
}