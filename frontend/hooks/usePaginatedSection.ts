import { useCallback, useRef, useState } from "react";

type ApiFn<T> = (lastKey?: string) => Promise<{ message: T[]; error: string | null }>;

export function usePaginatedSection<T>(apiFn: ApiFn<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastKeyRef = useRef<string | undefined>(undefined);

  const loadMore = useCallback(async (): Promise<boolean> => {
    if (!hasMore || isFetchingMore) return false;

    setIsFetchingMore(true);
    try {
      const result = await apiFn(lastKeyRef.current);

      if (result.error) {
        return false;
      }

      setData((prev) => [...prev, ...result.message]);

      // Your API returns lastEvaluatedKey — adapt if the shape differs
      const response = result as any;
      const newKey = response.lastEvaluatedKey ?? undefined;
      lastKeyRef.current = newKey;

      if (!newKey || result.message.length === 0) {
        setHasMore(false);
        return false;
      }

      return true;
    } finally {
      setIsFetchingMore(false);
    }
  }, [apiFn, hasMore, isFetchingMore]);

  const reset = useCallback(() => {
    setData([]);
    setHasMore(true);
    lastKeyRef.current = undefined;
  }, []);

  return { data, isFetchingMore, hasMore, loadMore, reset };
}