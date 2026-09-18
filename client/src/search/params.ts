// The URL query string is the single source of truth for the search, and uses
// the API's own param names, so the page URL maps straight onto the request.

export const FILTER_KEYS = ["nombre", "clase", "dieta", "continente", "habitat", "pesoMin", "pesoMax", "enPeligro"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

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
    const value = params.get(key);
    if (value !== null && value !== "") query.set(key, value);
  }
  return query.toString();
}

export function hasActiveFilters(params: URLSearchParams): boolean {
  return FILTER_KEYS.some((key) => (params.get(key) ?? "") !== "");
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
