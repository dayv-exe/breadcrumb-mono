import axiosInstance, { editUserDetailsData } from "@/constants/axios"
import { GetId } from "@/constants/userAccountDetails"
import axios, { AxiosError } from "axios"
import { MediaItem } from "./getPresignedUrl"
import { apiResponse } from "./models/apiResponse"
import { UserDetails } from "./models/userDetails"
export type UserInitialDetails = {
  sub: string
  nickname: string
  name: string
}

export const createUser = async (userDetails: UserInitialDetails): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>("/api/v1/users", userDetails)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const deleteUser = async (): Promise<apiResponse<string>> => {
  try {
    const userId = await GetId()
    const { data } = await axiosInstance.delete<{ message: string }>(`/api/v1/users/${userId}?action=delete`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const editUser = async (edit: editUserDetailsData): Promise<apiResponse<string>> => {
  try {
    const userId = await GetId()
    const { data } = await axiosInstance.put<{ message: string }>(`/api/v1/users/${userId}`, edit)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const getUser = async (idOrNickname: string): Promise<apiResponse<UserDetails | null>> => {
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails }>(`/api/v1/users/${idOrNickname}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.error((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}

export const getMyProfile = async (): Promise<apiResponse<UserDetails | null>> => {
  return getUser("")
}

type ApiErrorResponse = {
  message: string
  last?: unknown
}
export const updateProfilePicture = async ({ imageKey, thumbnailKey }: { imageKey: string, thumbnailKey: string }): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.put<{ message: string }>(`/api/v1/profile-picture?imageKey=${imageKey}&thumbnailKey=${thumbnailKey}`)
    return { message: data.message, error: null }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log((error.response?.data as ApiErrorResponse | undefined)?.message)
    }

    return { message: "", error: (error as AxiosError).message }
  }
}

export const getProfilePicture = async (userid: string): Promise<apiResponse<MediaItem | null>> => {
  try {
    const { data } = await axiosInstance.get<{ message: MediaItem }>(`/api/v1/profile-picture?userid=${userid}`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}