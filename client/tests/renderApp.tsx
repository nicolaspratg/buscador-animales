import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../src/App";
import { AuthProvider } from "../src/context/AuthContext";

export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
