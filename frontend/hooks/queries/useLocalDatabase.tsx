import { getAllCrumbs, getCrumbFeed, getCrumbFromLocal, getCrumbsWith } from "@/api/db/crumbsDb";
import { unsubscribeFromCurrentDbFile } from "@/api/db/InitDb";
import { CrumbMailbox } from "@/api/models/crumb";
import { Coordinates } from "@/utils/useLocationStore";
import {
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useWatchDbChanges } from "../useWatchDbChanges";

const WATCHED_TABLES = new Set(["crumbs", "chats", "places"]);

export function useDatabaseListener() {
  const qc = useQueryClient();
  useEffect(() => {
    qc.invalidateQueries()
    unsubscribeFromCurrentDbFile()

    return () => {
      qc.invalidateQueries()
      unsubscribeFromCurrentDbFile()
    }
  }, [])

  const mbReceived: CrumbMailbox = "received"
  const mbSent: CrumbMailbox = "sent"

  useWatchDbChanges({
    watchedTables: WATCHED_TABLES,
    onChange: () => {
      qc.invalidateQueries({ queryKey: ["crumbFeed"] })
      qc.invalidateQueries({ queryKey: ["crumbs", mbReceived] })
      qc.invalidateQueries({ queryKey: ["crumbs", mbSent] })
    }
  })
}

export function useCrumbFeed() {
  return useQuery({
    queryKey: ["crumbFeed"],
    queryFn: getCrumbFeed,
  });
}

export function useCrumbsWith(userid: string, coordinate: Coordinates) {
  return useQuery({
    queryKey: ["crumbsWith", userid],
    queryFn: () => getCrumbsWith(userid, coordinate.latitude, coordinate.longitude),
  });
}

export function useGetAllCrumbs(mailbox: CrumbMailbox) {
  return useQuery({
    queryKey: ["crumbs", mailbox],
    queryFn: () => getAllCrumbs(mailbox),
  });
}

export function useLocalCrumb(crumbId: string) {
  return useQuery({
    queryKey: ["crumb", crumbId],
    queryFn: () => getCrumbFromLocal(crumbId)
  })
}