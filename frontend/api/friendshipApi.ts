import axiosInstance from "@/constants/axios";
import { Friendship } from "./models/userDetails";

type LatestFriendshipResponse = {
  friendships: Friendship[]
  next?: string;
}
export async function getLatestFriendships(): Promise<LatestFriendshipResponse> {
  const lastFriendId = ""
  const lastTimestamp = 0

  let url = "/friendships"
  if (lastFriendId && lastTimestamp) {
    url += `?friendId=${lastFriendId}&timestamp=${lastTimestamp}`
  }

  const { data } = await axiosInstance.get<{ message: Friendship[], next?: string }>(url)
  return { friendships: data.message, next: data.next }
}