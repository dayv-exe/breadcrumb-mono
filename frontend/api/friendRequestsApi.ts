import axiosInstance from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"
import { UserDetails } from "./models/userDetails"

export const acceptFriendRequest = async (senderId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>("/api/v1/friends", { senderId: senderId })
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const getFriendRequests = async (next?: string): Promise<apiResponse<UserDetails[]>> => {
  const endPoint = `/api/v1/friend-requests`
  const endpointWithNextPage = `/api/v1/friend-requests?next=${next}`
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails[], next?: string }>(next ? endpointWithNextPage : endPoint)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const rejectFriendRequest = async (senderId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/api/v1/friend-requests/${senderId}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const sendFriendRequest = async (recipientId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>(`/api/v1/friend-requests`, { recipientId: recipientId })
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const unsendFriendRequest = async (recipientId: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/api/v1/friend-requests/${recipientId}?action=unsend`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}