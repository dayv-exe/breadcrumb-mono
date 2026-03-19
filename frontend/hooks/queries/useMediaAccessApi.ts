import { getURL } from "@/api/mediaAccessApi";
import { useQuery } from "@tanstack/react-query";

export const useMediaAccess = (mediaKey: string) => useQuery({
  queryFn: () => getURL({ key: mediaKey }),
  queryKey: [mediaKey + "access"],
  staleTime: 14 * (60 * 1000)
})