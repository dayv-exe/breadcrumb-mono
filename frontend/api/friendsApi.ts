import axiosInstance from "@/constants/axios"
import { UserDetails } from "./models/userDetails"

type FriendsResponse = {
  message: UserDetails[]
  next?: string
}

type FriendsPage = {
  Friends: UserDetails[]
  next?: string
}

export const getFriends = async (id: string, next?: string): Promise<FriendsPage> => {
  const endPoint = `/friends/${id}`
  const endPointNextPage = `/friends/${id}?next=${next}`
  const { data } = await axiosInstance.get<FriendsResponse>(next ? endPointNextPage : endPoint)
  return { Friends: data.message, next: data.next }
}

export const removeFriend = async (id: string): Promise<string> => {
  const { data } = await axiosInstance.delete<{ message: string }>(`/friends/${id}`)
  return data.message
}