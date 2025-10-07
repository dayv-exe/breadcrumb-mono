import { AxiosError } from 'axios';
import axiosInstance from '../constants/axios';

export const deleteAccount = async (n: string=""): Promise<{ successful: boolean, reason: string }> => {
  try {
    await axiosInstance.delete(`/delete/user`)
    return{successful: true, reason: ""}
  } catch (error) {
    const axiosError = error as AxiosError

    const status = axiosError.response?.status

    if (status === 401) {
      return { successful: false, reason: "Login to do this." }
    }

    console.error("User delete failed:", status, axiosError.message)
    return { successful: false, reason: "Something went wrong, try again." }
  }
}
