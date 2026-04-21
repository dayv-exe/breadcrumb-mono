import { fetchCrumbs, getCrumbs, shareCrumb, Viewport } from "@/api/crumbsApi";
import { TIME } from "@/constants/appConstants";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

export const useShareCrumb = () => useMutation({
  mutationFn: shareCrumb
})

export const useGetCrumbs = (from?: string) => useQuery({
  queryFn: () => getCrumbs(from ?? ""),
  queryKey: ["crumbs"],
  staleTime: 1 * TIME.MINUTE
})

export const useFetchCrumbs = (viewport: Viewport, from?: string) => {
  return useInfiniteQuery({
    queryKey: ["fetched-crumbs"],
    queryFn: ({ pageParam }) => fetchCrumbs(viewport, from, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next && lastPage.next !== "" ? lastPage.next : undefined,
    staleTime: 5 * TIME.MINUTE
  })
}