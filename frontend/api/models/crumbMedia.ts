import { MediaType } from "@/constants/media"

export type crumbMedia = {
  index: number
  crumbId: string
  media: string
  type: MediaType
  thumbnail?: string
  caption?: string
}