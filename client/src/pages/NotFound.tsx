import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export function NotFound() {
  return (
    <main className={styles.page}>
      <h1>Página no encontrada</h1>
      <p>
        <Link to="/">Volver al buscador</Link>
      </p>
    </main>
  );
}
