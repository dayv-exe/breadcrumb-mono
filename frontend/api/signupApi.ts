import axiosInstance from '../constants/axios';

export const abortSignUp = async (id: string): Promise<string> => {
  const { data } = await axiosInstance.delete<{ message: string }>(`/signup/${id}?action=abort`)

  return data.message
}
