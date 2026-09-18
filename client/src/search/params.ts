// The URL query string is the single source of truth for the search, and uses
// the API's own param names, so the page URL maps straight onto the request.

export const FILTER_KEYS = ["nombre", "clase", "dieta", "continente", "habitat", "pesoMin", "pesoMax", "enPeligro"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

/** Filters that accept several values, sent as repeated params and OR-ed by the API. */
export const MULTI_KEYS = ["clase", "dieta", "continente", "habitat"] as const;
export type MultiKey = (typeof MULTI_KEYS)[number];

export const SORT_FIELDS = ["nombreComun", "pesoPromedioKg", "esperanzaVidaAnios"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = "asc" | "desc";

const API_KEYS = [...FILTER_KEYS, "orderBy", "order", "page"] as const;

function isSortField(value: string | null): value is SortField {
  return SORT_FIELDS.some((field) => field === value);
}

/** Canonical API query: known keys only, fixed order, so equal searches produce equal strings. */
export function toApiQuery(params: URLSearchParams): string {
  const query = new URLSearchParams();
  for (const key of API_KEYS) {
    for (const value of params.getAll(key)) {
      if (value !== "") query.append(key, value);
    }
  }
  return query.toString();
}

export function hasActiveFilters(params: URLSearchParams): boolean {
  return FILTER_KEYS.some((key) => params.getAll(key).some((value) => value !== ""));
}

export function readSort(params: URLSearchParams): { orderBy: SortField | undefined; order: SortOrder } {
  const orderBy = params.get("orderBy");
  return {
    orderBy: isSortField(orderBy) ? orderBy : undefined,
    order: params.get("order") === "desc" ? "desc" : "asc",
  };
}

export function readPage(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function readMulti(params: URLSearchParams, key: MultiKey): string[] {
  return params.getAll(key).filter((value) => value !== "");
}
