import axiosInstance from "@/constants/axios"
import { UserDetails } from "./models/userDetails"

export const acceptFriendRequest = async (senderId: string): Promise<string> => {
  const { data } = await axiosInstance.post<{ message: string }>("/friends", { senderId: senderId })

  return data.message
}

type FriendReqResponse = {
  message: UserDetails[]
  next?: string
}

type FriendReqPage = {
  friendReqs: UserDetails[],
  next?: string
}

export const getFriendRequests = async (next?: string): Promise<FriendReqPage> => {
  const endPoint = `/friend-requests`
  const endpointWithNextPage = `/friend-requests?next=${next}`
  const { data } = await axiosInstance.get<FriendReqResponse>(next ? endpointWithNextPage : endPoint)
  return { friendReqs: data.message, next: data.next }
}

export const rejectFriendRequest = async (senderId: string): Promise<string> => {
  const { data } = await axiosInstance.delete<{ message: string }>(`/friend-requests/${senderId}`)

  return data.message
}

export const sendFriendRequest = async (recipientId: string): Promise<string> => {
  const { data } = await axiosInstance.post<{ message: string }>(`/friend-requests`, { recipientId: recipientId })

  return data.message
}

export const unsendFriendRequest = async (recipientId: string): Promise<string> => {
  const { data } = await axiosInstance.delete<{ message: string }>(`/friend-requests/${recipientId}?action=unsend`)

  return data.message
}