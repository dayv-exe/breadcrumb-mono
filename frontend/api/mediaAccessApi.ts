import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { MediaItem } from "./getPresignedUrl"
import { apiResponse } from "./models/apiResponse"

export type MediaAccessResponse = {
  url: string
  expiresAt: string
}

export const getCrumbMedia = async (crumbId: string, sentCrumb?: boolean): Promise<apiResponse<Map<number, MediaItem> | null>> => {
  if (!crumbId) {
    return { message: null, error: null }
  }

  try {
    const { data } = await axiosInstance.get<{ message: Map<number, MediaItem> }>(`/api/v1/media-access?action=sign&id=${crumbId}&sent=${sentCrumb}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}