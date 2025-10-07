import { AxiosError } from 'axios';
import axiosInstance, { editUserInfoData } from '../constants/axios';

export const editUserInfo = async (data: editUserInfoData): Promise<{ successful: boolean, reason: string }> => {
  try {
    await axiosInstance.post(`/edit/profile`, data)
    return{successful: true, reason: ""}
  } catch (error) {
    const axiosError = error as AxiosError

    const status = axiosError.response?.status

    if (status === 401) {
      return { successful: false, reason: "Login to do this." }
    }

    console.error("User edit failed:", status, axiosError.message)
    return { successful: false, reason: "Something went wrong, try again." }
  }
}
