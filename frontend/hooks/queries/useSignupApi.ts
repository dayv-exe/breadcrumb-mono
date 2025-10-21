import { abortSignUp } from "@/api/signupApi";
import { useMutation } from "@tanstack/react-query";

export const useAbortSignup = () => useMutation({
  mutationFn: abortSignUp
})