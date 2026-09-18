import { useId } from "react";
import type { FiltrosDisponibles } from "@shared/types";
import type { FilterKey } from "../search/params";
import styles from "./FilterForm.module.css";

export type DraftKey = Extract<FilterKey, "nombre" | "pesoMin" | "pesoMax">;
export type SelectKey = Exclude<FilterKey, DraftKey>;

interface FilterFormProps {
  filtros: FiltrosDisponibles | null;
  /** Free-text inputs: local, debounced drafts, so typing never waits on the URL or network. */
  drafts: Record<DraftKey, string>;
  /** Discrete controls, read straight from the URL. */
  selects: Record<SelectKey, string>;
  fieldErrors: Partial<Record<string, string>>;
  onDraftChange(key: DraftKey, value: string): void;
  onSelectChange(key: SelectKey, value: string): void;
}

type OptionList = "clases" | "dietas" | "continentes" | "habitats";

const SELECTS: { key: Exclude<SelectKey, "enPeligro">; label: string; all: string; options: OptionList }[] = [
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

export function FilterForm({ filtros, drafts, selects, fieldErrors, onDraftChange, onSelectChange }: FilterFormProps) {
  const id = useId();

  function errorFor(key: FilterKey) {
    const message = fieldErrors[key];
    return message === undefined ? null : (
      <p id={`${id}-${key}-error`} className={styles.error}>
        {message}
      </p>
    );
  }

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

      {(["pesoMin", "pesoMax"] as const).map((key) => (
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
            aria-invalid={fieldErrors[key] !== undefined}
            aria-describedby={fieldErrors[key] !== undefined ? `${id}-${key}-error` : undefined}
          />
          {errorFor(key)}
        </div>
      ))}

      {SELECTS.map(({ key, label, all, options }) => (
        <div key={key} className={styles.field}>
          <label htmlFor={`${id}-${key}`}>{label}</label>
          <select id={`${id}-${key}`} value={selects[key]} onChange={(event) => onSelectChange(key, event.target.value)}>
            <option value="">{all}</option>
            {(filtros?.[options] ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
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
                checked={selects.enPeligro === option.value}
                onChange={() => onSelectChange("enPeligro", option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
