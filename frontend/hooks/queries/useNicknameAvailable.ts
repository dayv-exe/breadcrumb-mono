import { nicknameAvailable } from "@/api/searchApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useNicknameAvailable = (username: string) => useQuery({
  queryFn: () => nicknameAvailable(username),
  queryKey: ["check-nickname", username],
  staleTime: 3 * (60 * 1000)
})

export const useNicknameAvailableFn = () => useMutation({
  mutationFn: nicknameAvailable
})