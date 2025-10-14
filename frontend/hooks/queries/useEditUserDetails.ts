import { useMutation } from '@tanstack/react-query';
import { editUserDetails } from '../../api/editUserDetails';

export const useEditUserDetails = () => useMutation({
  mutationFn: editUserDetails
})