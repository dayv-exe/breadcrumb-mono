import { validateUsername } from '@/constants/regexes';
import { AxiosError } from 'axios';
import axiosInstance from '../constants/axios';
import { apiResponse } from './models/apiResponse';

export const nicknameAvailable = async (username: string): Promise<apiResponse<boolean>> => {
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return { message: false, error: validation.reason }
  }

  try {
    const { data } = await axiosInstance.get<{ message: string }>(`/nickname/${username}`);
    const verdict = data.message.toLowerCase() === "true"
    return { message: verdict, error: verdict ? null : `${username} is already in use` };
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: false, error: (error as AxiosError).message }
  }
};
