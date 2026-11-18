import { apiRequest } from "../../lib/api";
import type {
  InventoryItem,
  InventorySummary,
  StockMovement,
  StockMovementInput,
} from "../../types/inventory";

export const inventoryApi = {
  getItems: () => apiRequest<InventoryItem[]>("/api/items"),
  getMovements: () => apiRequest<StockMovement[]>("/api/movements"),
  getSummary: () => apiRequest<InventorySummary>("/api/summary"),
  createMovement: (input: StockMovementInput) =>
    apiRequest<StockMovement>("/api/movements", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
