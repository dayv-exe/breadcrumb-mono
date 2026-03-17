import { getPresignedUrls } from "@/api/getPresignedUrl";
import { useMutation } from "@tanstack/react-query";

export const useGetPresignedUrl = () => useMutation({
  mutationFn: getPresignedUrls
})