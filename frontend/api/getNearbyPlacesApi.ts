import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse, extractBackendMsg } from "./models/apiResponse"

export const getNearbyPlaces = async (lat: number, lon: number, radius: number): Promise<apiResponse<string[]>> => {
  try {
    const { data } = await axiosInstance.get<{ message: string[] }>(`/api/v1/users/places?lat=${lat}&lon=${lon}&radius=${radius}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log(extractBackendMsg(error))
    return { message: [], error: (error as AxiosError).message }
  }
}