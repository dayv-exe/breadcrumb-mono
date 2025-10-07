import { useMutation, useQuery } from '@tanstack/react-query';
import { checkUsernameAvailability } from '../../api/username';

export const useUsernameAvailableOnInputChange = (username: string) => useQuery({
  queryKey: ['usernameAvailable', username],
  queryFn: () => checkUsernameAvailability(username),
  enabled: !!username,
  staleTime: 0.5 * (60 * 1000) // 30 secs
})

export const useUsernameAvailableOnSubmit = () => useMutation({
  mutationFn: checkUsernameAvailability
})