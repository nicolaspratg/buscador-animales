import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { FiltrosProvider } from "../context/FiltrosContext";

export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user === null) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <FiltrosProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </FiltrosProvider>
  );
}
