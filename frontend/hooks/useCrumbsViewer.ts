import { useOpenCrumb } from "./queries/useCrumbsApi";

interface props {
  crumbId: string
}

export function useCrumbsViewer({ crumbId }: props) {
  const { data: Media, error, isPending } = useOpenCrumb(crumbId)


}