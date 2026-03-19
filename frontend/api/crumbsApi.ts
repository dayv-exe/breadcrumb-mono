import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"

export type crumb = {
  id?: string
  lat: string
  lon: string
  mediaKeys: string[]
  sender?: string
}

export const getCrumbs = async (): Promise<apiResponse<crumb[]>> => {
  try {
    const { data } = await axiosInstance.get<{ message: crumb[] }>(`/crumbs`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const shareCrumb = async (crumb: crumb): Promise<apiResponse<crumb[]>> => {
  try {
    const { data } = await axiosInstance.post<{ message: crumb[] }>(`/crumbs`,
      {
        lat: crumb.lat,
        lon: crumb.lon,
        mediaKeys: crumb.mediaKeys,
      })
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}