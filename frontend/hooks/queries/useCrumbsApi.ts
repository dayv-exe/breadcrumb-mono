import { getCrumbs, shareCrumb } from "@/api/crumbsApi";
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
    staleTime: 0 * TIME.MINUTE
  })
}