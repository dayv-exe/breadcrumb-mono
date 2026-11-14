import { getCrumbMarkers, getLatestCrumbs, openCrumb, uploadCrumbMetadata } from "@/api/crumbsApi";
import { Crumb } from "@/api/models/crumb";
import { CRUMB_MEDIA_URL_TTL } from "@/constants/appConstants";
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

export const useGetCrumbMarkers = (ids: string[]) => useQuery({
  queryFn: () => getCrumbMarkers(ids),
  queryKey: ["markers"],
})

export const useOpenCrumb = (crumbId: string, isUnlocked: boolean) => useQuery({
  queryFn: () => openCrumb(crumbId),
  queryKey: ["opened-crumb", crumbId],
  staleTime: CRUMB_MEDIA_URL_TTL,
  enabled: isUnlocked,
})