import axiosInstance from "@/constants/axios";
import { validateUsername } from "@/constants/regexes";
import { UserDetails } from "./models/userDetails";

export const searchUser = async (searchString: string): Promise<UserDetails[]> => {
  searchString = searchString.toLowerCase()
  const { data } = await axiosInstance.get<{ message: UserDetails[] }>(`/search/${searchString}?action=user`)
  return data.message
}

export const nicknameAvailable = async (username: string): Promise<boolean> => {
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return false
  }
  const { data } = await axiosInstance.post<{ message: string }>(`/search/${username}`)
  return data.message.toLowerCase() === "true"
};