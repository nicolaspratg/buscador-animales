import { useCallback, useEffect, useState } from "react";
import type { Animal, Paginated } from "@shared/types";
import { fetchAnimals } from "../api/animals";
import { toApiError, type ApiError } from "../api/client";
import { useDelayedFlag } from "./useDelayedFlag";

const SLOW_REQUEST_MS = 150;

export interface AnimalsResult {
  /** The last successful response; kept during refetches so the table never empties. */
  data: Paginated<Animal> | null;
  error: ApiError | null;
  /** True only when a request has been pending for longer than SLOW_REQUEST_MS. */
  isSlow: boolean;
  retry(): void;
}

export function useAnimals(query: string): AnimalsResult {
  const [data, setData] = useState<Paginated<Animal> | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Aborting the previous request means a slow early response can never
    // overwrite the results of a later query.
    const controller = new AbortController();
    setIsPending(true);

    fetchAnimals(query, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setError(null);
        setIsPending(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(toApiError(caught));
        setIsPending(false);
      });

    return () => controller.abort();
  }, [query, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, error, isSlow: useDelayedFlag(isPending, SLOW_REQUEST_MS), retry };
}
