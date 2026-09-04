import { useQueryClient } from "@tanstack/react-query";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";

interface props {
  watchedTables: Set<string>
  onChange?: () => void
}

interface WatchDbChangesState {
  version: number
}

export function useWatchDbChanges({ watchedTables, onChange }: props): WatchDbChangesState {
  const [dbVersion, setDbVersion] = useState(0);
  const qc = useQueryClient();

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (!watchedTables.has(tableName)) return;
      clearTimeout(debounce);

      debounce = setTimeout(() => {
        onChange?.()
        setDbVersion(v => v + 1)
      }, 100);
    });

    return () => {
      clearTimeout(debounce);
      sub.remove();
    };
  }, [onChange, watchedTables, qc]);

  return {
    version: dbVersion
  }
}