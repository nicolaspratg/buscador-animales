import type { FilterKey } from "../search/params";
import { Button } from "./Button";
import styles from "./ActiveFilters.module.css";

export interface ActiveFilter {
  key: FilterKey;
  value: string;
  /** Field name, e.g. "Continente". */
  field: string;
  /** Human-readable value, e.g. "Asia" or "≥ 5 kg". */
  display: string;
}

interface ActiveFiltersProps {
  filters: readonly ActiveFilter[];
  onRemove(filter: ActiveFilter): void;
  onClearAll(): void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  return (
    <div className={styles.bar}>
      <ul className={styles.list} aria-label="Filtros activos">
        {filters.map((filter) => (
          <li key={`${filter.key}:${filter.value}`} className={styles.pill}>
            <span className={styles.field}>{filter.field}</span>
            <span>{filter.display}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Quitar filtro ${filter.field}: ${filter.display}`}
              onClick={() => onRemove(filter)}
            >
              <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
                <path d="M2 2l6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={onClearAll}>
        Limpiar filtros
      </Button>
    </div>
  );
}
