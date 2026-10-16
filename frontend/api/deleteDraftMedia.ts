import axiosInstance from "@/constants/axios";

export async function deleteDraftMedia(storageKeys: string[]) {
  if (storageKeys.length === 0) {
    return ""
  }

  const { data } = await axiosInstance.post<{ message: string }>("/media?action=delete", { storageKeys: storageKeys })

  return data.message
}