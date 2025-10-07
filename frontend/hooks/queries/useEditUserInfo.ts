import { useMutation } from '@tanstack/react-query';
import { editUserInfo } from '../../api/editUserInfo';

export const useEditUserInfo = () => useMutation({
  mutationFn: editUserInfo
})