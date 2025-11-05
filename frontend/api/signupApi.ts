import { AxiosError } from 'axios';
import axiosInstance from '../constants/axios';
import { apiResponse } from './models/apiResponse';

export const abortSignUp = async (id: string): Promise<apiResponse<string>> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(`/signup/${id}?action=abort`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: "", error: (error as AxiosError).message }
  }
}
