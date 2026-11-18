import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { ItemsPage, MovementsPage, StockPage } from "./InventoryPages";
import { inventoryApi } from "./api";

function renderWithQuery(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

describe("inventory pages", () => {
  it("filters current items by their name", async () => {
    const actor = userEvent.setup();
    renderWithQuery(<ItemsPage />);
    expect(await screen.findByText("Business laptop")).toBeInTheDocument();

    await actor.type(screen.getByRole("textbox", { name: "Search items" }), "mouse");
    expect(screen.getByText("Wireless mouse")).toBeInTheDocument();
    expect(screen.queryByText("Business laptop")).not.toBeInTheDocument();
  });

  it("reports backend movement errors", async () => {
    const actor = userEvent.setup();
    server.use(
      http.post("/api/movements", () =>
        HttpResponse.json({ message: "Quantity exceeds available stock" }, { status: 409 }),
      ),
    );
    renderWithQuery(<StockPage storeName="IT Store Room" />);

    await screen.findByRole("option", { name: /Business laptop/ });
    await actor.selectOptions(screen.getByLabelText("Item"), "item-1");
    await actor.clear(screen.getByLabelText("Quantity"));
    await actor.type(screen.getByLabelText("Quantity"), "30");
    await actor.type(screen.getByLabelText("Paper requisition number"), "REQ-TEST");
    await actor.click(screen.getByRole("button", { name: "Record stock IN" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Quantity exceeds available stock",
    );
    await waitFor(() => expect(screen.getByLabelText("Item")).toHaveValue("item-1"));
  });

  it("records stock IN and confirms the result", async () => {
    const actor = userEvent.setup();
    renderWithQuery(<StockPage storeName="IT Store Room" />);

    await screen.findByRole("option", { name: /Business laptop/ });
    expect(screen.queryByLabelText("Receiving branch / unit")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collected by")).not.toBeInTheDocument();
    await actor.selectOptions(screen.getByLabelText("Item"), "item-1");
    await actor.clear(screen.getByLabelText("Quantity"));
    await actor.type(screen.getByLabelText("Quantity"), "2");
    await actor.type(screen.getByLabelText("Paper requisition number"), "REQ-TEST-1");
    await actor.click(screen.getByRole("button", { name: "Record stock IN" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Stock IN recorded successfully.",
    );
    const movements = await inventoryApi.getMovements();
    expect(movements[0]).toMatchObject({
      type: "IN",
      reference: "REQ-TEST-1",
    });
    expect(movements[0]).not.toHaveProperty("recipient");
    expect(movements[0]).not.toHaveProperty("collectedBy");
  });

  it("requires and records the recipient and collector for Stock OUT", async () => {
    const actor = userEvent.setup();
    renderWithQuery(<StockPage storeName="IT Store Room" />);

    await screen.findByRole("option", { name: /Business laptop/ });
    await actor.selectOptions(screen.getByLabelText("Item"), "item-1");
    await actor.click(screen.getByRole("radio", { name: /Stock OUT/ }));
    await actor.type(screen.getByLabelText("Quantity"), "2");
    await actor.type(screen.getByLabelText("Issue reference"), "ISS-TEST-2");
    await actor.click(screen.getByRole("button", { name: "Record stock OUT" }));

    expect(await screen.findByText("Enter the receiving branch or unit")).toBeInTheDocument();
    expect(screen.getByText("Enter who collected the item")).toBeInTheDocument();

    await actor.type(screen.getByPlaceholderText("Enter branch or unit"), "Operations Unit");
    await actor.type(screen.getByPlaceholderText("Enter collector's name"), "Jordan Lee");
    await actor.click(screen.getByRole("button", { name: "Record stock OUT" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Stock OUT recorded successfully.",
    );
    const movements = await inventoryApi.getMovements();
    expect(movements[0]).toMatchObject({
      type: "OUT",
      recipient: "Operations Unit",
      collectedBy: "Jordan Lee",
    });

    renderWithQuery(<MovementsPage />);
    expect(await screen.findByText(/To Operations Unit · Collected by Jordan Lee/)).toBeInTheDocument();
  });
});
