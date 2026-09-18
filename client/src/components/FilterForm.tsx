import { useId } from "react";
import type { FiltrosDisponibles } from "@shared/types";
import type { MultiKey } from "../search/params";
import { MultiSelect } from "./MultiSelect";
import styles from "./FilterForm.module.css";

export type DraftKey = "nombre" | "pesoMin" | "pesoMax";

interface FilterFormProps {
  filtros: FiltrosDisponibles | null;
  /** Free-text inputs: local, debounced drafts, so typing never waits on the URL or network. */
  drafts: Record<DraftKey, string>;
  /** Discrete controls, read straight from the URL. */
  multi: Record<MultiKey, string[]>;
  enPeligro: string;
  fieldErrors: Partial<Record<string, string>>;
  onDraftChange(key: DraftKey, value: string): void;
  onMultiChange(key: MultiKey, values: string[]): void;
  onEnPeligroChange(value: string): void;
}

const MULTI_SELECTS: { key: MultiKey; label: string; all: string; options: "clases" | "dietas" | "continentes" | "habitats" }[] = [
  { key: "clase", label: "Clase", all: "Todas", options: "clases" },
  { key: "dieta", label: "Dieta", all: "Todas", options: "dietas" },
  { key: "continente", label: "Continente", all: "Todos", options: "continentes" },
  { key: "habitat", label: "Hábitat", all: "Todos", options: "habitats" },
];

const EN_PELIGRO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "true", label: "Sí" },
  { value: "false", label: "No" },
];

export function FilterForm(props: FilterFormProps) {
  const { filtros, drafts, fieldErrors, onDraftChange } = props;
  const id = useId();

  return (
    <form className={styles.form} role="search" aria-label="Filtros" onSubmit={(event) => event.preventDefault()}>
      <div className={`${styles.field} ${styles.wide}`}>
        <label htmlFor={`${id}-nombre`}>Nombre</label>
        <input
          id={`${id}-nombre`}
          type="search"
          placeholder="Ej.: león"
          autoComplete="off"
          value={drafts.nombre}
          onChange={(event) => onDraftChange("nombre", event.target.value)}
        />
      </div>

      {(["pesoMin", "pesoMax"] as const).map((key) => {
        const error = fieldErrors[key];
        const errorId = `${id}-${key}-error`;
        return (
          <div key={key} className={styles.field}>
            <label htmlFor={`${id}-${key}`}>{key === "pesoMin" ? "Peso mínimo (kg)" : "Peso máximo (kg)"}</label>
            <input
              id={`${id}-${key}`}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder={filtros === null ? "" : String(filtros[key])}
              value={drafts[key]}
              onChange={(event) => onDraftChange(key, event.target.value)}
              aria-invalid={error !== undefined}
              aria-describedby={error !== undefined ? errorId : undefined}
            />
            {error !== undefined && (
              <p id={errorId} className={styles.error}>
                {error}
              </p>
            )}
          </div>
        );
      })}

      {MULTI_SELECTS.map(({ key, label, all, options }) => (
        <MultiSelect
          key={key}
          label={label}
          allLabel={all}
          options={filtros?.[options] ?? []}
          selected={props.multi[key]}
          onChange={(values) => props.onMultiChange(key, values)}
        />
      ))}

      <fieldset className={`${styles.field} ${styles.wide} ${styles.fieldset}`}>
        <legend>En peligro de extinción</legend>
        <div className={styles.segmented}>
          {EN_PELIGRO_OPTIONS.map((option) => (
            <label key={option.value} className={styles.segment}>
              <input
                type="radio"
                name={`${id}-enPeligro`}
                value={option.value}
                checked={props.enPeligro === option.value}
                onChange={() => props.onEnPeligroChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
