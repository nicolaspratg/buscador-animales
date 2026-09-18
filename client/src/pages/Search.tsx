import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ActiveFilters, type ActiveFilter } from "../components/ActiveFilters";
import { Banner } from "../components/Banner";
import { Button } from "../components/Button";
import { FilterForm, type DraftKey } from "../components/FilterForm";
import { Pagination } from "../components/Pagination";
import { ResultsTable } from "../components/ResultsTable";
import { useFiltros } from "../context/FiltrosContext";
import { useAnimals } from "../hooks/useAnimals";
import { useDebouncedCallback } from "../hooks/useDebounce";
import {
  FILTER_KEYS,
  MULTI_KEYS,
  hasActiveFilters,
  readMulti,
  readPage,
  readSort,
  toApiQuery,
  type MultiKey,
  type SortField,
} from "../search/params";
import styles from "./Search.module.css";

const TEXT_DEBOUNCE_MS = 200;

type Drafts = Record<DraftKey, string>;
const EMPTY_DRAFTS: Drafts = { nombre: "", pesoMin: "", pesoMax: "" };

const FIELD_LABELS: Record<MultiKey, string> = {
  clase: "Clase",
  dieta: "Dieta",
  continente: "Continente",
  habitat: "Hábitat",
};

function resultCountLabel(total: number): string {
  return total === 1 ? "1 animal encontrado" : `${total} animales encontrados`;
}

/** One pill per applied value, read from the URL (so a pill appears once its value is applied). */
function activeFiltersFrom(params: URLSearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  const nombre = params.get("nombre");
  if (nombre !== null && nombre !== "") filters.push({ key: "nombre", value: nombre, field: "Nombre", display: `“${nombre}”` });
  for (const key of MULTI_KEYS) {
    for (const value of readMulti(params, key)) filters.push({ key, value, field: FIELD_LABELS[key], display: value });
  }
  const pesoMin = params.get("pesoMin");
  if (pesoMin !== null && pesoMin !== "") filters.push({ key: "pesoMin", value: pesoMin, field: "Peso", display: `≥ ${pesoMin} kg` });
  const pesoMax = params.get("pesoMax");
  if (pesoMax !== null && pesoMax !== "") filters.push({ key: "pesoMax", value: pesoMax, field: "Peso", display: `≤ ${pesoMax} kg` });
  const enPeligro = params.get("enPeligro");
  if (enPeligro === "true" || enPeligro === "false") {
    filters.push({ key: "enPeligro", value: enPeligro, field: "En peligro", display: enPeligro === "true" ? "Sí" : "No" });
  }
  return filters;
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
  // A list value replaces every occurrence of a repeatable param.
  function updateParams(changes: Partial<Record<string, string | readonly string[]>>, { resetPage = true } = {}) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key);
          const values = typeof value === "string" ? [value] : (value ?? []);
          for (const item of values) if (item !== "") next.append(key, item);
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

  function removeFilter(filter: ActiveFilter) {
    if (filter.key === "nombre" || filter.key === "pesoMin" || filter.key === "pesoMax") {
      // Apply now, with the other drafts, rather than waiting out the debounce.
      const next = { ...drafts, [filter.key]: "" };
      commitDrafts.cancel();
      setDrafts(next);
      updateParams(next);
    } else if (filter.key === "enPeligro") {
      updateParams({ enPeligro: "" });
    } else {
      updateParams({ [filter.key]: readMulti(searchParams, filter.key).filter((value) => value !== filter.value) });
    }
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
  const activeFilters = activeFiltersFrom(searchParams);
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
        multi={{
          clase: readMulti(searchParams, "clase"),
          dieta: readMulti(searchParams, "dieta"),
          continente: readMulti(searchParams, "continente"),
          habitat: readMulti(searchParams, "habitat"),
        }}
        enPeligro={searchParams.get("enPeligro") ?? ""}
        fieldErrors={fieldErrors}
        onDraftChange={handleDraftChange}
        onMultiChange={(key, values) => updateParams({ [key]: values })}
        onEnPeligroChange={(value) => updateParams({ enPeligro: value })}
      />

      {filtersActive && <ActiveFilters filters={activeFilters} onRemove={removeFilter} onClearAll={clearFilters} />}

      <p className={styles.count} role="status">
        {countLabel}
      </p>

      <section className={styles.results} aria-label="Resultados">
        {renderResults()}
      </section>
    </div>
  );
}
