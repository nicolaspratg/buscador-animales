import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRedirectPath } from "./redirect";

// Also performs the post-login redirect: once login sets the user, this sends
// them back to where they came from, so the forms never navigate themselves.
export function PublicOnlyRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user !== null) return <Navigate to={getRedirectPath(location.state)} replace />;
  return <Outlet />;
}
