import { acceptFriendRequest, getFriendRequests, rejectFriendRequest, sendFriendRequest, unsendFriendRequest } from "@/api/friendRequestsApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useAcceptFriendRequests = () => useMutation({
  mutationFn: acceptFriendRequest
})

export const useGetFriendRequests = () => useQuery({
  queryFn: () => getFriendRequests(),
  queryKey: ["friend-requests"],
  staleTime: 2 * (60 * 1000)
})

export const useRejectFriendRequest = () => useMutation({
  mutationFn: rejectFriendRequest
})

export const useSendFriendRequest = () => useMutation({
  mutationFn: sendFriendRequest
})

export const useUnsendFriendRequest = () => useMutation({
  mutationFn: unsendFriendRequest
})