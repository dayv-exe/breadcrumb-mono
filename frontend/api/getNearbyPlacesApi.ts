import axiosInstance from "@/constants/axios"

export const getNearbyPlaces = async (lat: number, lon: number, radius: number): Promise<string[]> => {
  const { data } = await axiosInstance.get<{ message: string[] }>(`/users/places?lat=${lat}&lon=${lon}&radius=${radius}`)

  return data.message
}