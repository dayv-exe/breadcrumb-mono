import { useMutation } from '@tanstack/react-query';
import { abortSignUp } from '../../api/abortSignup';

export const useAbortSignup = () => useMutation({
  mutationFn: abortSignUp
})