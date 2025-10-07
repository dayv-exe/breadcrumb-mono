import { AxiosError } from 'axios';
import axiosInstance from '../constants/axios';

export const abortSignUp = async (id: string): Promise<{ successful: boolean, reason: string }> => {
  try {
    const { data } = await axiosInstance.get<{message: string}>(`/abort_signup/${id}`)
    return{successful: true, reason:data.message}
  } catch (error) {
    const axiosError = error as AxiosError

    const status = axiosError.response?.status

    if (status === 404) {
      return { successful: false, reason: "Signup request not found." }
    }

    if (status === 403) {
      return { successful: false, reason: "Email not verified. Cannot abort signup." }
    }

    console.error("Abort signup failed:", status, axiosError.message)
    return { successful: false, reason: "Something went wrong, try again." }
  }
}
