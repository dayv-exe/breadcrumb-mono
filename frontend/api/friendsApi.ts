import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"
import { UserDetails } from "./models/userDetails"

export const getFriends = async (id: string, lastEvalKey?: string): Promise<apiResponse<UserDetails[]>> => {
  const endPoint = `/api/v1/friends/${id}`
  const endPointNextPage = `/api/v1/friends/${id}?last=${lastEvalKey}`
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails[], last?: string }>(lastEvalKey ? endPointNextPage : endPoint)
    console.log("List of friends")
    console.log(data.message)
    return { message: data.message, last: data.last, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const removeFriend = async (id: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/api/v1/friends/${id}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}