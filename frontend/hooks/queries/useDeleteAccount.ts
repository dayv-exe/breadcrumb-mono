import { deleteAccount } from '@/api/deleteAccount';
import { useMutation } from '@tanstack/react-query';

export const useDeleteAccount = () => useMutation({
  mutationFn: deleteAccount
})