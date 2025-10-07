import { AxiosError } from 'axios';
import axiosInstance from '../constants/axios';
import { UserDetails } from './models/userDetails';

export interface UserDetailsResponse {
  user: UserDetails | null
  error?: string
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getUserDetails = async (getUrl: string): Promise<UserDetailsResponse> => {
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails }>(getUrl)
    return { user: data.message }
  } catch (error) {
    const axiosError = error as AxiosError
    const status = axiosError.response?.status
    if (status === 404) {
      return { user: null, error: "User not found!" }
    }
    return { user: null, error: axiosError.message ?? "An error occurred while try to get user." }
  }
}

export const getUserDetailsByNickname = async (nickname: string): Promise<UserDetailsResponse> => {
  return getUserDetails(`/user/nickname/${nickname}`)
}

export const getUserDetailsById = async (id: string): Promise<UserDetailsResponse> => {
  return getUserDetails(`/user/id/${id}`)
}