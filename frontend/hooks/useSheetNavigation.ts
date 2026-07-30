import { useCallback, useState } from "react";

export type MapSheetRoute = "home" | "poi" | "pin" | "crumbs" | "crumb";
export type CameraPageRoute = "camera" | "preview"

export type NavigatableBottomSheetViewType<T> = {
  current: string
  push: (route: T) => void
  pop: () => void
  reset: (route: T) => void
  canGoBack: boolean
}

export function useSheetNavigation<T extends string>(initial: T): NavigatableBottomSheetViewType<T> {
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