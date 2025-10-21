import axiosInstance, { editUserDetailsData } from "@/constants/axios"
import { AxiosError } from "axios"
import { apiResponse } from "./models/apiResponse"
import { UserDetails } from "./models/userDetails"
export type UserInitialDetails = {
  sub: string
  nickname: string
  name: string
}

export const createUser = async (userDetails: UserInitialDetails): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>("/u", userDetails)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const deleteUser = async (): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/u`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const editUser = async (edit: editUserDetailsData): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.put<{ message: string }>(`/u`, edit)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}

export const getUser = async (idOrNickname: string): Promise<apiResponse<UserDetails | null>> => {
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails }>(`/u/${idOrNickname}`)
    console.log(data.message)
    return { message: data.message, error: null }
  } catch (error) {
    console.error((error as AxiosError).message)
    return { message: null, error: (error as AxiosError).message }
  }
}

export const searchUser = async (searchString: string): Promise<apiResponse<UserDetails[]>> => {
  searchString = searchString.toLowerCase()
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails[] }>(`/search/${searchString}`);
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}