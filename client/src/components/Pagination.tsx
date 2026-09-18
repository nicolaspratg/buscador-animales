import { Button } from "./Button";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange(page: number): void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <Button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Anterior
      </Button>
      <span className={styles.status}>
        Página {page} de {totalPages}
      </span>
      <Button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Siguiente
      </Button>
    </nav>
  );
}
