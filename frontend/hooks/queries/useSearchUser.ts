import { searchUser } from '@/api/search';
import { useMutation, useQuery } from '@tanstack/react-query';

export const useSearchUser = () => useMutation({
  mutationFn: searchUser
})


export const useSearchUserOnInputChange = (searchString: string) => useQuery({
  queryKey: ['search_string', searchString],
  queryFn: () => searchUser(searchString),
  enabled: searchString.length > 1,
  staleTime: 60 * 1000 // 1 min
})
