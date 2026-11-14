import { Crumb } from "@/api/models/crumb";
import LockedCrumbShared from "./LockedCrumbItem";
import UnlockedCrumbShared from "./UnlockedCrumbItem";

interface props {
  crumb: Crumb
}

export default function CrumbSharedItem({ crumb }: props) {
  return (
    <>
      {
        crumb.unlocked &&
        <UnlockedCrumbShared crumb={crumb} />
      }

      {
        !crumb.unlocked &&
        <LockedCrumbShared crumb={crumb} />
      }
    </>
  )
}