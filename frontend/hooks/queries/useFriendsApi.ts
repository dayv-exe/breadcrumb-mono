import { getFriends, removeFriend } from "@/api/friendsApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetFriends = (userid: string) => useQuery({
  queryFn: () => getFriends(userid),
  queryKey: ["user-friends", userid],
})

export const useRemoveFriend = () => useMutation({
  mutationFn: removeFriend
})
