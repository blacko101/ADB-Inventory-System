import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import type { User } from "./types/inventory";
import App from "./App";

function renderApp(user: User, initialPath = "/") {
  server.use(
    http.get("/api/session", () => HttpResponse.json(user)),
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sessionUser: User = {
  id: "user-2",
  name: "Sam Lee",
  email: "sam@example.org",
  role: "Inventory user",
  currentStoreName: "Central Technology Store",
  permissions: ["inventory:read"],
};

describe("permission-aware workspace", () => {
  it("hides unavailable navigation and redirects a disallowed direct route", async () => {
    renderApp(sessionUser, "/stock");

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Items & stock" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Record movement" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Movement history" })).not.toBeInTheDocument();
  });

  it("displays the current store name from the session", async () => {
    renderApp({
      ...sessionUser,
      permissions: ["inventory:read", "movement:read", "movement:create"],
    });

    expect(await screen.findAllByText("Central Technology Store")).not.toHaveLength(0);
    expect(await screen.findAllByAltText("Agricultural Development Bank")).not.toHaveLength(0);
    expect(screen.queryByText("IT Store Room")).not.toBeInTheDocument();
  });
});
