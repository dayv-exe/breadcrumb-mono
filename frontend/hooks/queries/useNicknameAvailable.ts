import { nicknameAvailable } from "@/api/searchApi";
import { TIME } from "@/constants/appConstants";
import { validateUsername } from "@/constants/regexes";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useNicknameAvailable = (username: string) => useQuery({
  enabled: validateUsername(username).isValid,
  queryFn: () => nicknameAvailable(username),
  queryKey: ["check-nickname", username],
  retry: false,
  staleTime: 2 * TIME.MINUTE,
})

export const useNicknameAvailableFn = () => useMutation({
  mutationFn: nicknameAvailable
})