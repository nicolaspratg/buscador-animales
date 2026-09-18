import { Link, useLocation } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export function Signup() {
  const { signup } = useAuth();
  const location = useLocation();

  return (
    <AuthForm
      title="Crear cuenta"
      submitLabel="Crear cuenta"
      pendingLabel="Creando cuenta…"
      passwordAutoComplete="new-password"
      passwordHint="Mínimo 6 caracteres"
      onSubmit={signup}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" state={location.state}>
            Inicia sesión
          </Link>
        </>
      }
    />
  );
}
