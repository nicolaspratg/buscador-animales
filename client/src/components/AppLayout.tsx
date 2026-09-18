import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";
import styles from "./AppLayout.module.css";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Buscador de Animales</span>
        <div className={styles.account}>
          <span className={styles.email}>{user?.email}</span>
          <Button variant="ghost" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
