import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

/**
 * Delays `callback` until calls stop for `delayMs`. A debounced callback rather
 * than a debounced value, so a pending call can be cancelled (e.g. by
 * "Limpiar filtros") instead of landing 200ms later and undoing the reset.
 */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delayMs: number) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => clearTimeout(timerRef.current), []);

  const run = useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [delayMs],
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(() => ({ run, cancel }), [run, cancel]);
}
