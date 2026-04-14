import { searchUser } from "@/api/searchApi";
import { createUser, deleteUser, editUser, getProfilePicture, getUser, updateProfilePicture } from "@/api/userApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfilePicture,
    
    onSuccess(data) {
      queryClient.invalidateQueries({ queryKey: ["profile-picture", data.message] })
    },
  })
}

export const useGetProfilePicture = (userid: string) => useQuery({
  queryKey: ["profile-picture", userid],
  enabled: userid.length > 0,
  queryFn: () => getProfilePicture(userid),
  staleTime: 1 * (60 * 1000)
})