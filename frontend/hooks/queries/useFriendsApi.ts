import { getFriends, removeFriend } from "@/api/friendsApi";
import { TIME } from "@/constants/appConstants";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetFriends = (userid: string, includeUserProfile?: boolean) =>
  useInfiniteQuery({
    queryKey: ["user-friends", userid],
    queryFn: ({ pageParam }) => getFriends(userid, includeUserProfile, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next && lastPage.next !== "" ? lastPage.next : undefined,
    staleTime: 5 * TIME.MINUTE,
  });

export const useRemoveFriend = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeFriend,
    onSuccess(data, variables, onMutateResult, context) {
      qc.invalidateQueries({ queryKey: ["user-friends", variables] })
      qc.invalidateQueries({ queryKey: ["user-friends", data] })
    },
  })
}
