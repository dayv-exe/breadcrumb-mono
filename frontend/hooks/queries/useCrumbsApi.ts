import { getCrumbMarkers, getLatestCrumbs, uploadCrumbMetadata } from "@/api/crumbsApi";
import { Crumb } from "@/api/models/crumb";
import { TIME } from "@/constants/appConstants";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

export const useUploadCrumbMetadataApi = () => useMutation({
  mutationFn: uploadCrumbMetadata
})

export const useGetLatestCrumbs = (userid: string, lastCrumb: Crumb | null) => {
  return useInfiniteQuery({
    queryKey: [`latest-crumbs-${userid}`],
    queryFn: () => getLatestCrumbs(userid, lastCrumb),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next && lastPage.next !== "" ? lastPage.next : undefined,
  })
}

export const useGetCrumbMarkers = () => useQuery({
  queryFn: getCrumbMarkers,
  queryKey: ["crumb", "markers"],
  staleTime: 1 * TIME.HOUR,
  enabled: true,
})