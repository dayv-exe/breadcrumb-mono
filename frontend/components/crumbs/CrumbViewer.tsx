import { Crumb } from "@/api/models/crumb";
import { ScrollView } from "react-native";
import CrumbView from "./CrumbView";

type CrumbViewerType = {
  crumbs: Crumb[]
}

export default function CrumbViewer({ crumbs }: CrumbViewerType) {
  const media = crumbs.flatMap(c => c.media)

  return (
    <ScrollView>
      {
        media.map(m => (
          <CrumbView
            key={m.media}
            type="readonly"
            media={m}
            size={300}
          />
        ))
      }
    </ScrollView>
  )
}