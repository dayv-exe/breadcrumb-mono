import { AxiosError } from 'axios';
import axiosInstance from '../constants/axios';
import { userSearchDetails } from './models/userSearchDetails';

export interface searchResponse {
  results: userSearchDetails[] | null
  error?: string
}

export const searchUser = async (searchString: string): Promise<searchResponse> => {
  searchString = searchString.toLowerCase()
  try {
    const { data } = await axiosInstance.get<{ message: userSearchDetails[] }>(`/search/${searchString}`);
    return { results: data.message }
  } catch (error) {
    const axiosError = error as AxiosError
        const status = axiosError.response?.status
        //console.error("failed to get user details:", status, axiosError.response?.data)
        if (status === 404) {
          return { results: [], error: "User not found!" }
        }
        return { results: [], error: axiosError.message ?? "An error occurred while try to get user." }
  }
};
