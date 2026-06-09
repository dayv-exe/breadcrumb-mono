import { useCallback, useState } from "react";

export function useSheetNavigation<T extends string>(initial: T) {
  const [stack, setStack] = useState<T[]>([initial]);
  const current = stack[stack.length - 1];

  const push = useCallback((route: T) => setStack(s => [...s, route]), []);
  const pop = useCallback(
    () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
    []
  );
  const reset = useCallback((route: T) => setStack([route]), []);

  return { current, push, pop, reset, canGoBack: stack.length > 1 };
}