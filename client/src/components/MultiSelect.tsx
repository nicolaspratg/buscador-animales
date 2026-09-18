import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./MultiSelect.module.css";

interface MultiSelectProps {
  label: string;
  /** Shown when nothing is selected, meaning "no filter". */
  allLabel: string;
  options: readonly string[];
  selected: readonly string[];
  onChange(next: string[]): void;
}

// A disclosure button plus native checkboxes: keyboard and screen-reader
// support come from the platform instead of a hand-rolled listbox.
export function MultiSelect({ label, allLabel, options, selected, onChange }: MultiSelectProps) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusFirstOnOpen = useRef(false);

  const labelId = `${id}-label`;
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;

  useEffect(() => {
    if (!isOpen) return;

    if (focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      checkboxes()[0]?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function checkboxes(): HTMLInputElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []);
  }

  function toggle(option: string) {
    const next = selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option];
    // Options order, not click order, so the same selection always yields the same URL.
    const known = options.filter((value) => next.includes(value));
    const unknown = next.filter((value) => !options.includes(value));
    onChange([...known, ...unknown]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();

    if (!isOpen) {
      focusFirstOnOpen.current = true;
      setIsOpen(true);
      return;
    }

    const boxes = checkboxes();
    const current = boxes.findIndex((box) => box === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = current === -1 ? 0 : (current + step + boxes.length) % boxes.length;
    boxes[nextIndex]?.focus();
  }

  // Past one value the names no longer fit; the pills below the form list them all.
  let summary = `${selected.length} selecciones`;
  if (selected.length === 0) summary = allLabel;
  else if (selected.length === 1) summary = selected[0] ?? allLabel;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        // Close when Tab moves focus elsewhere. A null relatedTarget (e.g. Safari
        // not focusing a clicked checkbox) is left to the outside-click handler.
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <label id={labelId} htmlFor={triggerId}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={styles.trigger}
        data-empty={selected.length === 0}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${triggerId}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.summary}>{summary}</span>
      </button>

      {isOpen && (
        <div ref={panelRef} id={panelId} className={styles.panel} role="group" aria-labelledby={labelId}>
          {options.map((option) => (
            <label key={option} className={styles.option}>
              <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
