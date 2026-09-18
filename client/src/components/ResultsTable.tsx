import type { Animal } from "@shared/types";
import type { SortField, SortOrder } from "../search/params";
import styles from "./ResultsTable.module.css";

// Up to 4 decimals covers the dataset (lightest is 0.0001 kg) without rounding it away.
const weightFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 4 });
const integerFormat = new Intl.NumberFormat("es");

const SKELETON_ROWS = 10;

interface ResultsTableProps {
  animals: readonly Animal[];
  orderBy: SortField | undefined;
  order: SortOrder;
  onSort(field: SortField): void;
  /** Previous rows stay visible, dimmed, while a slow refetch is in flight. */
  isStale?: boolean;
  isSkeleton?: boolean;
}

interface SortHeaderProps {
  field: SortField;
  label: string;
  numeric?: boolean;
  orderBy: SortField | undefined;
  order: SortOrder;
  onSort(field: SortField): void;
}

function SortHeader({ field, label, numeric = false, orderBy, order, onSort }: SortHeaderProps) {
  const active = orderBy === field;
  const ariaSort = active ? (order === "asc" ? "ascending" : "descending") : "none";

  return (
    <th scope="col" aria-sort={ariaSort} className={numeric ? styles.numeric : undefined}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(field)}>
        {label}
        <svg
          className={styles.sortIcon}
          data-state={active ? order : "none"}
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path d="M3 4.5 6 1.5l3 3M3 7.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </th>
  );
}

export function ResultsTable({ animals, orderBy, order, onSort, isStale = false, isSkeleton = false }: ResultsTableProps) {
  const sortProps = { orderBy, order, onSort };

  return (
    // Focusable so keyboard users can scroll the table horizontally on small screens.
    <div className={styles.scroller} tabIndex={0} role="region" aria-labelledby="results-caption">
      <table className={styles.table} data-stale={isStale} aria-busy={isStale || isSkeleton}>
        <caption id="results-caption" className="visually-hidden">
          Resultados de la búsqueda de animales
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.numeric}>ID</th>
            <SortHeader field="nombreComun" label="Nombre común" {...sortProps} />
            <th scope="col">Nombre científico</th>
            <th scope="col">Clase</th>
            <th scope="col">Hábitat</th>
            <th scope="col">Dieta</th>
            <SortHeader field="pesoPromedioKg" label="Peso (kg)" numeric {...sortProps} />
            <SortHeader field="esperanzaVidaAnios" label="Vida (años)" numeric {...sortProps} />
            <th scope="col">Continente</th>
            <th scope="col">En peligro</th>
          </tr>
        </thead>
        <tbody>
          {isSkeleton
            ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                <tr key={row} className={styles.skeletonRow} aria-hidden="true">
                  {Array.from({ length: 10 }, (_, cell) => (
                    <td key={cell}>
                      <span className={styles.skeleton} />
                    </td>
                  ))}
                </tr>
              ))
            : animals.map((animal) => (
                <tr key={animal.id}>
                  <td className={styles.numeric}>{animal.id}</td>
                  <th scope="row" className={styles.name}>
                    {animal.nombreComun}
                  </th>
                  <td className={styles.scientific}>{animal.nombreCientifico}</td>
                  <td>{animal.clase}</td>
                  <td>{animal.habitat}</td>
                  <td>{animal.dieta}</td>
                  <td className={styles.numeric}>{weightFormat.format(animal.pesoPromedioKg)}</td>
                  <td className={styles.numeric}>{integerFormat.format(animal.esperanzaVidaAnios)}</td>
                  <td>{animal.continente}</td>
                  <td>
                    <span className={styles.badge} data-endangered={animal.enPeligroExtincion}>
                      {animal.enPeligroExtincion ? "En peligro" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
