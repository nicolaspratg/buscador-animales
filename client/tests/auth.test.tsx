import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { ApiErrorBody } from "@shared/types";
import { renderApp } from "./renderApp";
import { server } from "./server";

describe("auth flow", () => {
  it("redirects an unauthenticated visitor from / to the login page", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Buscar animales" })).toBeNull();
  });

  it("shows an error banner when login returns 401", async () => {
    const body: ApiErrorBody = { error: { code: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" } };
    server.use(http.post("*/api/auth/login", () => HttpResponse.json(body, { status: 401 })));
    renderApp("/login");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nico@example.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "wrong-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Email o contraseña incorrectos");
    // Still on the login page: a failed login must not trigger the session-expiry redirect.
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeTruthy();
  });
});
