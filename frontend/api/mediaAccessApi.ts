import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"

export type MediaAccessRequest = {
  key: string
}

export type MediaAccessResponse = {
  url: string
  expiresAt: string
}

export const getURL = async (req: MediaAccessRequest): Promise<apiResponse<MediaAccessResponse | null>> => {
  try {
    const { data } = await axiosInstance.post<{ message: MediaAccessResponse }>("/api/v1/media/access", {
      key: req.key
    })
    console.log(data.message.url)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}