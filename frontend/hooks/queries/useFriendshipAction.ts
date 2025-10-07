import { acceptFriendRequest, cancelFriendRequest, endFriendship, getAllFriendRequests, getAllFriends, rejectFriendRequest, sendFriendRequest } from '@/api/friendshipAction';
import { useMutation, useQuery } from '@tanstack/react-query';

export const useSendFriendRequest = () => useMutation({
  mutationFn: sendFriendRequest
})

export const useCancelFriendRequest = () => useMutation({
  mutationFn: cancelFriendRequest
})

export const useAcceptFriendRequest = () => useMutation({
  mutationFn: acceptFriendRequest
})

export const useRejectFriendRequest = () => useMutation({
  mutationFn: rejectFriendRequest
})

export const useGetAllFriendRequests = () => useQuery({
  queryKey: ["friendRequests"],
  queryFn: getAllFriendRequests,
  enabled: false,
  staleTime: 1 * (60 * 1000)
})

export const useGetAllFriends = (userid: string) => useQuery({
  queryKey: ["friends"],
  queryFn: () => getAllFriends(userid),
  staleTime: 1 * (60 * 1000),
  enabled: userid.length > 0
})

export const useEndFriendship = () => useMutation({
  mutationFn: endFriendship
})