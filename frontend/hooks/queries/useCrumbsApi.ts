import { getCrumbs, shareCrumb } from "@/api/crumbsApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useShareCrumb = () => useMutation({
  mutationFn: shareCrumb
})

export const useGetCrumbs = () => useQuery({
  queryFn: () => getCrumbs(),
  queryKey: ["crumbs"],
  staleTime: 1 * (60 * 1000)
})