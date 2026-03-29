import { getCrumbs, shareCrumb } from "@/api/crumbsApi";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useShareCrumb = () => useMutation({
  mutationFn: shareCrumb
})

export const useGetCrumbs = (from?: string) => useQuery({
  queryFn: () => getCrumbs(from ?? ""),
  queryKey: ["crumbs"],
  staleTime: 1 * (60 * 1000)
})