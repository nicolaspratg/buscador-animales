import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "./renderApp";
import { LEON, page, server, signIn } from "./server";

describe("search page", () => {
  it("sends one debounced request for a burst of typing, not one per character", async () => {
    const nombres: (string | null)[] = [];
    server.use(
      http.get("*/api/animales", ({ request }) => {
        nombres.push(new URL(request.url).searchParams.get("nombre"));
        return HttpResponse.json(page([LEON]));
      }),
    );
    signIn();
    renderApp("/");
    await screen.findByText("León");

    const input = screen.getByLabelText("Nombre");
    for (const value of ["l", "le", "leo", "leon"]) {
      fireEvent.change(input, { target: { value } });
    }

    await waitFor(() => expect(nombres).toContain("leon"));
    // Give any stray per-keystroke timers time to fire before counting.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(nombres.filter((nombre) => nombre !== null)).toEqual(["leon"]);
  });

  it("renders the empty state when the API returns no results", async () => {
    server.use(http.get("*/api/animales", () => HttpResponse.json(page([]))));
    signIn();
    renderApp("/?clase=Ave");

    expect(await screen.findByText("No se encontraron animales con esos filtros")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("0 animales encontrados");
  });

  it("restores filters from the URL, including repeated values", async () => {
    signIn();
    renderApp("/?nombre=leon&continente=%C3%81frica&continente=Asia");

    expect((await screen.findByLabelText<HTMLInputElement>("Nombre")).value).toBe("leon");
    expect(screen.getByRole("button", { name: /^Continente/ }).textContent).toBe("2 selecciones");
    expect(screen.getByRole("button", { name: "Quitar filtro Continente: Asia" })).toBeTruthy();
  });

  it("sends every checked value and drops one when its pill is removed", async () => {
    const requests: string[][] = [];
    server.use(
      http.get("*/api/animales", ({ request }) => {
        requests.push(new URL(request.url).searchParams.getAll("continente"));
        return HttpResponse.json(page([LEON]));
      }),
    );
    signIn();
    renderApp("/");
    await screen.findByText("León");

    fireEvent.click(screen.getByRole("button", { name: /^Continente/ }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Asia" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "África" }));

    // Stored in the dataset's order, not click order, so equal selections share a URL.
    await waitFor(() => expect(requests.at(-1)).toEqual(["África", "Asia"]));

    fireEvent.click(screen.getByRole("button", { name: "Quitar filtro Continente: África" }));
    await waitFor(() => expect(requests.at(-1)).toEqual(["Asia"]));
  });
});
