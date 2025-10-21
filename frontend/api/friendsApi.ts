import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"
import { UserDetails } from "./models/userDetails"

export const getFriends = async (id: string): Promise<apiResponse<UserDetails[]>> => {
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails[] }>(`/friends/${id}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const removeFriend = async (id: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/friends/${id}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}