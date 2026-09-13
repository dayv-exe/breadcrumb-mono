import axiosInstance, { editUserDetailsData } from "@/constants/axios"
import { MediaData } from "@/constants/media"
import { GetId } from "@/constants/userAccountDetails"
import { UserDetails } from "./models/userDetails"

export type UserInitialDetails = {
  userid: string
  displayName: string
  displayNickname?: string
}

export const getDisplayName = (user: UserDetails | undefined | null, defaultToNickname: boolean = false) => {
  if (!user) return "<unknown user>"
  else if (!defaultToNickname && user.name) return user.name
  else return user.nickname || "<unknown user>"
}

export const createUser = async (userDetails: UserInitialDetails): Promise<string> => {
  const { data } = await axiosInstance.post<{ message: string }>("/users", userDetails)
  return data.message
}

export const deleteUser = async (): Promise<string> => {
  const userId = await GetId()
  const { data } = await axiosInstance.delete<{ message: string }>(`/users/${userId}?action=delete`)
  return data.message
}

export const editUser = async (edit: editUserDetailsData): Promise<string> => {
  const userId = await GetId()
  const { data } = await axiosInstance.put<{ message: string }>(`/users/${userId}`, edit)
  return data.message
}

export const getUser = async (idOrNickname: string): Promise<UserDetails | null> => {
  const { data } = await axiosInstance.get<{ message: UserDetails }>(`/users/${idOrNickname}`)

  return data.message
}

export const getMyProfile = async (): Promise<UserDetails | null> => {
  return getUser("")
}

export const updateProfilePicture = async ({ imageKey, thumbnailKey }: { imageKey: string, thumbnailKey: string }): Promise<string> => {
  const { data } = await axiosInstance.put<{ message: string }>(`/profile-picture?imageKey=${imageKey}&thumbnailKey=${thumbnailKey}`)

  return data.message
}

export const getProfilePicture = async (userid: string): Promise<MediaData | null> => {
  const { data } = await axiosInstance.get<{ message: MediaData }>(`/profile-picture/${userid}`)

  return data.message
}