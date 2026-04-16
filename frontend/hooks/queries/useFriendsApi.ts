import { getFriends, removeFriend } from "@/api/friendsApi";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetFriends = (userid: string) =>
  useInfiniteQuery({
    queryKey: ["user-friends", userid],
    queryFn: ({ pageParam }) => getFriends(userid, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.last && lastPage.last !== "" ? lastPage.last : undefined,
  });

export const useRemoveFriend = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeFriend,
    onSuccess(data, variables, onMutateResult, context) {
      qc.invalidateQueries({queryKey: ["user-friends", variables]})
      qc.invalidateQueries({queryKey: ["user-friends", data.message]})
    },
  })
}
