import { acceptFriendRequest, getFriendRequests, rejectFriendRequest, sendFriendRequest, unsendFriendRequest } from "@/api/friendRequestsApi";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useAcceptFriendRequests = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess(data, variables, onMutateResult, context) {
      qc.invalidateQueries({ queryKey: ["user-friends", variables] })
      qc.invalidateQueries({ queryKey: ["user-friends", data.message] })
      qc.invalidateQueries({ queryKey: ["friend-requests"] })
    },
  })
}

export const useGetFriendRequests = () => useInfiniteQuery({
  queryKey: ["friend-requests"],
  queryFn: ({ pageParam }) => getFriendRequests(pageParam),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage.last && lastPage.last !== "" ? lastPage.last : undefined,
});

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess(data, variables, onMutateResult, context) {
      queryClient.invalidateQueries({
        queryKey: ["user-details", variables]
      })

      queryClient.invalidateQueries({
        queryKey: ["friend-requests"]
      })
    }
  })
}

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess(data, variables, onMutateResult, context) {
      queryClient.invalidateQueries({
        queryKey: ["user-details", variables]
      })
    },
  })
}

export const useUnsendFriendRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: unsendFriendRequest,
    onSuccess(data, variables, onMutateResult, context) {
      queryClient.invalidateQueries({
        queryKey: ["user-details", variables]
      })
    },
  })
}