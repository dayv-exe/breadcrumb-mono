import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"
import { UserDetails } from "./models/userDetails"

export const acceptFriendRequest = async (senderId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>("/friends", {senderId: senderId})
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const getFriendRequests = async (): Promise<apiResponse<UserDetails[]>> => {
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails[] }>(`/friend-requests`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const rejectFriendRequest = async (senderId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/friend-requests/${senderId}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const sendFriendRequest = async (recipientId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>(`/friend-requests`, { recipientId: recipientId })
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const unsendFriendRequest = async (recipientId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.get<{ message: string }>(`/friend-requests/unsend/${recipientId}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}