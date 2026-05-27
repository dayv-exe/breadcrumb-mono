import axiosInstance from "@/constants/axios"
import { MediaData } from "@/constants/media"

export type MediaAccessResponse = {
  url: string
  expiresAt: string
}

export const getCrumbMedia = async (crumbId: string, sentCrumb?: boolean): Promise<Map<number, MediaData> | null> => {
  if (!crumbId) {
    return null
  }
  const { data } = await axiosInstance.get<{ message: Map<number, MediaData> }>(`/media-access?action=sign&id=${crumbId}&sent=${sentCrumb}`)

  return data.message
}