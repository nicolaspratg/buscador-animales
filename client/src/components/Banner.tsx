import type { ReactNode } from "react";
import styles from "./Banner.module.css";

export function Banner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.banner} role="alert">
      <p className={styles.message}>{children}</p>
      {action}
    </div>
  );
}
