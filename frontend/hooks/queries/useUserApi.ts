import { createUser, deleteUser, editUser, getUser, searchUser } from "@/api/userApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreateUser = () => useMutation({
  mutationFn: createUser
})

export const useDeleteUser = () => useMutation({
  mutationFn: () => deleteUser()
})

export const useEditUser = () => useMutation({
  mutationFn: editUser
})

export const useGetUser = (idOrNickname: string) => useQuery({
  queryFn: () => getUser(idOrNickname),
  queryKey: ["user-details", idOrNickname],
  staleTime: 2 * (60 * 1000)
})

export const useSearchUser = (str: string) => useQuery({
  queryFn: () => searchUser(str),
  queryKey: ["search-user", str],
  staleTime: 2 * (60 * 1000),
  enabled: str.length >= 2
})