import { MediaType } from "@/constants/media"

export type Media = {
  index: number
  crumbId?: string
  media: string
  type: MediaType
  thumbnail?: string
  caption?: string
}