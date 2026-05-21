import { searchUser } from "@/api/searchApi";
import { createUser, deleteUser, editUser, getProfilePicture, getUser, updateProfilePicture } from "@/api/userApi";
import { TIME } from "@/constants/appConstants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCreateUser = () => useMutation({
  mutationFn: createUser
})

export const useDeleteUser = () => useMutation({
  mutationFn: () => deleteUser()
})

export const useEditUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: editUser,
    onSuccess(data, variables, onMutateResult, context) {
      qc.invalidateQueries({
        queryKey: ["user-details", data.message]
      })
    },
  })
}

export const useGetUser = (idOrNickname: string) => useQuery({
  queryFn: () => getUser(idOrNickname),
  queryKey: ["user-details", idOrNickname],
  staleTime: 10 * TIME.MINUTE
})

export const useSearchUser = (str: string) => useQuery({
  queryFn: () => searchUser(str),
  queryKey: ["search-user", str],
  staleTime: 2 * TIME.MINUTE,
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
  queryFn: () => getProfilePicture(userid),
  staleTime: 10 * TIME.MINUTE,
  enabled: userid !== "disabled"
})