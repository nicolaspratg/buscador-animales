import { useEffect, useState } from "react";

/**
 * Follows `flag`, but only turns on once it has stayed on for `delayMs`.
 * Requests against a local API finish in a few ms; showing a skeleton for
 * those reads as flicker, so loading UI only appears for genuinely slow ones.
 */
export function useDelayedFlag(flag: boolean, delayMs: number): boolean {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!flag) {
      setDelayed(false);
      return;
    }
    const timer = setTimeout(() => setDelayed(true), delayMs);
    return () => clearTimeout(timer);
  }, [flag, delayMs]);

  return flag && delayed;
}
