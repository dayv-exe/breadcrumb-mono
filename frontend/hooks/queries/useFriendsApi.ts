import { getFriends, removeFriend } from "@/api/friendsApi";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

export const useGetFriends = (userid: string) =>
  useInfiniteQuery({
    queryKey: ["user-friends", userid],
    queryFn: ({ pageParam }) => getFriends(userid, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.last && lastPage.last !== "" ? lastPage.last : undefined,
  });

export const useRemoveFriend = () => useMutation({
  mutationFn: removeFriend
})
