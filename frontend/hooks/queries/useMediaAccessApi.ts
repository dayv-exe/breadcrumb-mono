import { getCrumbMedia } from "@/api/mediaAccessApi";
import { useQuery } from "@tanstack/react-query";

export const useMediaAccess = (crumbId: string, sentCrumb?: boolean) => useQuery({
  queryFn: () => getCrumbMedia(crumbId, sentCrumb),
  queryKey: ["access" + crumbId],
  staleTime: 14 * (60 * 1000)
})