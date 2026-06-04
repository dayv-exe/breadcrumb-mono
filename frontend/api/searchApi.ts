import axiosInstance from "@/constants/axios";
import { AxiosError } from "axios";
import { UserDetails } from "./models/userDetails";

export const searchUser = async (searchString: string): Promise<UserDetails[]> => {
  searchString = searchString.toLowerCase()
  const { data } = await axiosInstance.get<{ message: UserDetails[] }>(`/search/${searchString}?action=user`)
  return data.message
}

export type NicknameAvailableResponse = "true" | "false" | "invalid"

export const nicknameAvailable = async (username: string): Promise<NicknameAvailableResponse> => {
  try {
    const { data } = await axiosInstance.post<{ message: string }>(`/search/${username}`)
    return data.message.toLowerCase() === "true" ? "true" : "false"
  } catch (error) {
    console.log((error as AxiosError).status)
    if ((error as AxiosError).status === 403) {
      return "invalid"
    }
    throw error
  }
};