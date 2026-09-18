import { useId, useState, type FormEvent, type ReactNode } from "react";
import type { Credentials } from "../api/auth";
import { toApiError } from "../api/client";
import { Banner } from "./Banner";
import { Button } from "./Button";
import styles from "./AuthForm.module.css";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  passwordHint?: string;
  onSubmit(credentials: Credentials): Promise<void>;
  footer: ReactNode;
}

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function AuthForm(props: AuthFormProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await props.onSubmit({ email, password });
      // On success the auth state changes and the route redirects; nothing to reset.
    } catch (error) {
      const apiError = toApiError(error);
      const details = apiError.fieldErrors();
      if (apiError.details.length > 0) {
        setFieldErrors({ email: details["email"], password: details["password"] });
      } else {
        setFormError(apiError.message);
      }
      setIsSubmitting(false);
    }
  }

  const emailErrorId = `${id}-email-error`;
  const passwordNoteId = `${id}-password-note`;
  const passwordNote = fieldErrors.password ?? props.passwordHint;

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>{props.title}</h1>

        {formError !== null && <Banner>{formError}</Banner>}

        <div className={styles.field}>
          <label htmlFor={`${id}-email`}>Email</label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={fieldErrors.email !== undefined}
            aria-describedby={fieldErrors.email !== undefined ? emailErrorId : undefined}
            required
          />
          {fieldErrors.email !== undefined && (
            <p id={emailErrorId} className={styles.error}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${id}-password`}>Contraseña</label>
          <input
            id={`${id}-password`}
            type="password"
            autoComplete={props.passwordAutoComplete}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={fieldErrors.password !== undefined}
            aria-describedby={passwordNote !== undefined ? passwordNoteId : undefined}
            required
          />
          {passwordNote !== undefined && (
            <p id={passwordNoteId} className={fieldErrors.password !== undefined ? styles.error : styles.hint}>
              {passwordNote}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isSubmitting ? props.pendingLabel : props.submitLabel}
        </Button>

        <p className={styles.footer}>{props.footer}</p>
      </form>
    </main>
  );
}
