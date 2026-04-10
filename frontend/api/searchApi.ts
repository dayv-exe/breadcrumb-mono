import axiosInstance from "@/constants/axios";
import { validateUsername } from "@/constants/regexes";
import { AxiosError } from "axios";
import { apiResponse } from "./models/apiResponse";
import { UserDetails } from "./models/userDetails";

export const searchUser = async (searchString: string): Promise<apiResponse<UserDetails[]>> => {
  searchString = searchString.toLowerCase()
  try {
    const { data } = await axiosInstance.get<{ message: UserDetails[] }>(`/api/v1/search/${searchString}?action=user`)
    return { message: data.message, error: null }
  } catch (error) {
    console.log((error as AxiosError).message)
    return { message: [], error: (error as AxiosError).message }
  }
}

export const nicknameAvailable = async (username: string): Promise<apiResponse<boolean>> => {
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return { message: false, error: validation.reason }
  }

  try {
    const { data } = await axiosInstance.post<{ message: string }>(`/api/v1/search/${username}`)
    const verdict = data.message.toLowerCase() === "true"
    return { message: verdict, error: verdict ? null : `${username} is already in use` }
  } catch (error) {
    console.log((error as AxiosError).message)
    if ((error as AxiosError).response?.status === 403) {
      return { message: false, error: "That username is not allowed 📖" }
    }
    return { message: false, error: (error as AxiosError).message }
  }
};