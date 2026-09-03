import { getAllCrumbs, getChatList, getCrumbFromLocal, getCrumbsWith } from "@/api/db/crumbsDb";
import { CrumbMailbox } from "@/api/models/crumb";
import {
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import * as SQLite from "expo-sqlite";
import React, { useEffect } from "react";

const WATCHED_TABLES = new Set(["crumbs", "chats", "places"]);

export function useDbInvalidation() {
  const qc = useQueryClient();

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (!WATCHED_TABLES.has(tableName)) return;

      clearTimeout(debounce);
      debounce = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["chatList"] })
        qc.invalidateQueries({ queryKey: ["crumbs"] });
      }, 100);
    });

    return () => {
      clearTimeout(debounce);
      sub.remove();
    };
  }, [qc]);
}

// ---------------------------------------------------------------------------
// Provider — wrap your app root with this once
// ---------------------------------------------------------------------------
export function DbBridge({ children }: { children: React.ReactNode }) {
  useDbInvalidation(); // must run inside the provider (uses useQueryClient)
  return <>{children}</>;
}

export function useChatList() {
  return useQuery({
    queryKey: ["chatList"],
    queryFn: getChatList,
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