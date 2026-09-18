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

  it("restores filters from the URL", async () => {
    signIn();
    renderApp("/?nombre=leon&clase=Mam%C3%ADfero");

    expect((await screen.findByLabelText<HTMLInputElement>("Nombre")).value).toBe("leon");
    await waitFor(() => expect(screen.getByLabelText<HTMLSelectElement>("Clase").value).toBe("Mamífero"));
  });
});
