import { useQuery } from '@tanstack/react-query';
import { getUserDetailsById, getUserDetailsByNickname } from '../../api/getUserDetails';

export const useGetUserDetailsById = (userId: string) => useQuery({
  queryKey: ["userDetails", userId],
  enabled: !!userId,
  queryFn: () => getUserDetailsById(userId),
})

export const useGetUserDetailsByNickname = (nickname: string) => useQuery({
  queryKey: ["userDetails", nickname],
  enabled: !!nickname,
  queryFn: () => getUserDetailsByNickname(nickname),
})