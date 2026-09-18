import { Link, useLocation } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const location = useLocation();

  return (
    <AuthForm
      title="Iniciar sesión"
      submitLabel="Entrar"
      pendingLabel="Entrando…"
      passwordAutoComplete="current-password"
      onSubmit={login}
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/signup" state={location.state}>
            Regístrate
          </Link>
        </>
      }
    />
  );
}
