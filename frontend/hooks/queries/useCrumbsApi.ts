import { getCrumbs, getLatestCrumbs, shareCrumb } from "@/api/crumbsApi";
import { TIME } from "@/constants/appConstants";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

export const useShareCrumb = () => useMutation({
  mutationFn: shareCrumb
})

export const useGetCrumbs = () => {
  return useInfiniteQuery({
    queryKey: ["crumbs"],
    queryFn: ({ pageParam }) => getCrumbs(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next && lastPage.next !== "" ? lastPage.next : undefined,
    staleTime: 15 * TIME.MINUTE
  })
}

export const useGetLatestCrumbs = (sentCrumbs: boolean, crumbId?: string, lastTimeStamp?: string) => {
  return useInfiniteQuery({
    queryKey: [`latest-crumbs-${sentCrumbs ? "sent" : "received"}`],
    queryFn: () => getLatestCrumbs(sentCrumbs, crumbId, lastTimeStamp),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next && lastPage.next !== "" ? lastPage.next : undefined,
  })
}