import { nicknameAvailable } from "@/api/searchApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useNicknameAvailable = (username: string) => useQuery({
  queryFn: () => nicknameAvailable(username),
  queryKey: ["check-nickname", username],
  staleTime: 1 * (60 * 1000) // 3 mins cache
})

export const useNicknameAvailableFn = () => useMutation({
  mutationFn: nicknameAvailable
})