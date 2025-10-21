import axiosInstance from "@/constants/axios";
import { AxiosError } from "axios";
import { apiResponse } from "./models/apiResponse";

export type signedUrlResponse = {
  imageKey: string
  uploadUrl: string
}

export const getPresignedUrl = async (fileExtension: string): Promise<apiResponse<signedUrlResponse | null>> => {
  try {
    const { data } = await axiosInstance.get<{ message: signedUrlResponse }>(`/presigned_url?ext=${fileExtension}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}