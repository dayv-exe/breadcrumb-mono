import { AxiosError } from "axios"

export type apiResponse<T> = {
  message: T
  next?: string
  error: string | null
}

export const extractBackendMsg = (error: any): string => {
  const axiosError = error as AxiosError<{ message: string }>;
  return axiosError.response?.data?.message
    ?? axiosError.message; // fallback to generic Axios message
}