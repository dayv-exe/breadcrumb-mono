import axiosInstance from "@/constants/axios"
import { MediaData } from "@/constants/media"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"

export type MediaAccessResponse = {
  url: string
  expiresAt: string
}

export const getCrumbMedia = async (crumbId: string, sentCrumb?: boolean): Promise<apiResponse<Map<number, MediaData> | null>> => {
  if (!crumbId) {
    return { message: null, error: null }
  }

  try {
    const { data } = await axiosInstance.get<{ message: Map<number, MediaData> }>(`/api/v1/media-access?action=sign&id=${crumbId}&sent=${sentCrumb}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}