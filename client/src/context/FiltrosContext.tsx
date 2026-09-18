import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { FiltrosDisponibles } from "@shared/types";
import { fetchFiltros } from "../api/animals";
import { toApiError, type ApiError } from "../api/client";

type FiltrosState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; filtros: FiltrosDisponibles };

const FiltrosContext = createContext<FiltrosState | null>(null);

/** Fetches the filter options once per protected session; they never change at runtime. */
export function FiltrosProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FiltrosState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchFiltros(controller.signal)
      .then((filtros) => setState({ status: "ready", filtros }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error: toApiError(error) });
      });
    return () => controller.abort();
  }, []);

  return <FiltrosContext value={state}>{children}</FiltrosContext>;
}

export function useFiltros(): FiltrosState {
  const context = useContext(FiltrosContext);
  if (context === null) throw new Error("useFiltros must be used inside <FiltrosProvider>");
  return context;
}
