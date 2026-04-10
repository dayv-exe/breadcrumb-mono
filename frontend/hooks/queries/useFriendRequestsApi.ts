import { acceptFriendRequest, getFriendRequests, rejectFriendRequest, sendFriendRequest, unsendFriendRequest } from "@/api/friendRequestsApi";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

export const useAcceptFriendRequests = () => useMutation({
  mutationFn: acceptFriendRequest
})

export const useGetFriendRequests = () => useInfiniteQuery({
  queryKey: ["friend-requests"],
  queryFn: ({ pageParam }) => getFriendRequests(pageParam),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage.last && lastPage.last !== "" ? lastPage.last : undefined,
});

export const useRejectFriendRequest = () => useMutation({
  mutationFn: rejectFriendRequest
})

export const useSendFriendRequest = () => useMutation({
  mutationFn: sendFriendRequest
})

export const useUnsendFriendRequest = () => useMutation({
  mutationFn: unsendFriendRequest
})