import { validateUsername } from '@/constants/regexes';
import axiosInstance from '../constants/axios';

export const checkUsernameAvailability = async (username: string): Promise<{ isValid: boolean, reason: string }> => {
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return { isValid: false, reason: validation.reason }
  }

  try {
    const { data } = await axiosInstance.get<{ message: string }>(`/nickname_available/${username}`);
    const verdict = data.message.toLowerCase() === "true"
    return { isValid: verdict, reason: verdict ? "" : `${username} is already in use` };
  } catch (error) {
    console.log("ERROR: ", error)
    return { isValid: false, reason: "something went wrong, try again." }
  }
};
