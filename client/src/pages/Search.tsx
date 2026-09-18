import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Banner } from "../components/Banner";
import { Button } from "../components/Button";
import { FilterForm, type DraftKey, type SelectKey } from "../components/FilterForm";
import { Pagination } from "../components/Pagination";
import { ResultsTable } from "../components/ResultsTable";
import { useFiltros } from "../context/FiltrosContext";
import { useAnimals } from "../hooks/useAnimals";
import { useDebouncedCallback } from "../hooks/useDebounce";
import { FILTER_KEYS, hasActiveFilters, readPage, readSort, toApiQuery, type SortField } from "../search/params";
import styles from "./Search.module.css";

const TEXT_DEBOUNCE_MS = 200;

type Drafts = Record<DraftKey, string>;
const EMPTY_DRAFTS: Drafts = { nombre: "", pesoMin: "", pesoMax: "" };

function resultCountLabel(total: number): string {
  return total === 1 ? "1 animal encontrado" : `${total} animales encontrados`;
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtrosState = useFiltros();
  const { data, error, isSlow, retry } = useAnimals(toApiQuery(searchParams));

  // Typed values stay local and are only committed to the URL after a pause, so
  // the input is never tied to navigation or network timing. Initialised from
  // the URL so a shared or refreshed search restores what was typed.
  const [drafts, setDrafts] = useState<Drafts>(() => ({
    nombre: searchParams.get("nombre") ?? "",
    pesoMin: searchParams.get("pesoMin") ?? "",
    pesoMax: searchParams.get("pesoMax") ?? "",
  }));

  // `replace` keeps typing out of the history stack; the URL is still shareable.
  function updateParams(changes: Partial<Record<string, string>>, { resetPage = true } = {}) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === "") next.delete(key);
          else next.set(key, value);
        }
        if (resetPage) next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  // One debounced commit carries all three drafts, so editing a second field
  // before the first one fires can't drop the first change.
  const commitDrafts = useDebouncedCallback((next: Drafts) => updateParams(next), TEXT_DEBOUNCE_MS);

  function handleDraftChange(key: DraftKey, value: string) {
    const next = { ...drafts, [key]: value };
    setDrafts(next);
    commitDrafts.run(next);
  }

  function handleSelectChange(key: SelectKey, value: string) {
    updateParams({ [key]: value });
  }

  function clearFilters() {
    commitDrafts.cancel();
    setDrafts(EMPTY_DRAFTS);
    updateParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, ""])));
  }

  const { orderBy, order } = readSort(searchParams);

  function handleSort(field: SortField) {
    const nextOrder = orderBy === field && order === "asc" ? "desc" : "asc";
    updateParams({ orderBy: field, order: nextOrder === "desc" ? "desc" : "" });
  }

  const filtersActive = hasActiveFilters(searchParams) || Object.values(drafts).some((value) => value !== "");
  const fieldErrors = error?.status === 400 ? error.fieldErrors() : {};
  const filtros = filtrosState.status === "ready" ? filtrosState.filtros : null;

  let countLabel = "Buscando…";
  if (error !== null) countLabel = "";
  else if (data !== null) countLabel = resultCountLabel(data.meta.total);

  function renderResults() {
    if (error !== null) {
      const isValidation = error.status === 400;
      return (
        <Banner action={isValidation ? undefined : <Button onClick={retry}>Reintentar</Button>}>
          {error.message}
        </Banner>
      );
    }

    if (data === null) {
      return isSlow ? <ResultsTable animals={[]} orderBy={orderBy} order={order} onSort={handleSort} isSkeleton /> : null;
    }

    if (data.meta.total === 0) {
      return (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No se encontraron animales con esos filtros</p>
          <Button onClick={clearFilters}>Limpiar filtros</Button>
        </div>
      );
    }

    return (
      <>
        <ResultsTable animals={data.data} orderBy={orderBy} order={order} onSort={handleSort} isStale={isSlow} />
        <Pagination
          page={readPage(searchParams)}
          totalPages={data.meta.totalPages}
          onPageChange={(page) => updateParams({ page: page === 1 ? "" : String(page) }, { resetPage: false })}
        />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Buscar animales</h1>

      {filtrosState.status === "error" && (
        <Banner>No se pudieron cargar las opciones de filtro: {filtrosState.error.message}</Banner>
      )}

      <FilterForm
        filtros={filtros}
        drafts={drafts}
        selects={{
          clase: searchParams.get("clase") ?? "",
          dieta: searchParams.get("dieta") ?? "",
          continente: searchParams.get("continente") ?? "",
          habitat: searchParams.get("habitat") ?? "",
          enPeligro: searchParams.get("enPeligro") ?? "",
        }}
        fieldErrors={fieldErrors}
        onDraftChange={handleDraftChange}
        onSelectChange={handleSelectChange}
      />

      <div className={styles.toolbar}>
        <p className={styles.count} role="status">
          {countLabel}
        </p>
        {filtersActive && (
          <Button variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <section className={styles.results} aria-label="Resultados">
        {renderResults()}
      </section>
    </div>
  );
}
