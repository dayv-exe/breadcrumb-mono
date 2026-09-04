import { getAllCrumbs, getCrumbFeed, getCrumbFromLocal, getCrumbsWith } from "@/api/db/crumbsDb";
import { CrumbMailbox } from "@/api/models/crumb";
import {
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import React from "react";
import { useWatchDbChanges } from "../useWatchDbChanges";

const WATCHED_TABLES = new Set(["crumbs", "chats", "places"]);

export function useDbInvalidation() {
  const qc = useQueryClient();

  const mbReceived: CrumbMailbox = "received"
  const mbSaved: CrumbMailbox = "saved"
  const mbSent: CrumbMailbox = "sent"

  useWatchDbChanges({
    watchedTables: WATCHED_TABLES,
    onChange: () => {
      qc.invalidateQueries({ queryKey: ["crumbFeed"] })
      qc.invalidateQueries({ queryKey: ["crumbs", mbReceived] })
      qc.invalidateQueries({ queryKey: ["crumbs", mbSaved] })
      qc.invalidateQueries({ queryKey: ["crumbs", mbSent] })
    }
  })
}

export function DbBridge({ children }: { children: React.ReactNode }) {
  useDbInvalidation();
  return <>{children}</>;
}

export function useCrumbFeed() {
  return useQuery({
    queryKey: ["crumbFeed"],
    queryFn: getCrumbFeed,
  });
}

export function useCrumbsWith(userid: string) {
  return useQuery({
    queryKey: ["crumbsWith", userid],
    queryFn: () => getCrumbsWith(userid),
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