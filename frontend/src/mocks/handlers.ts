import { http, HttpResponse } from "msw";
import type {
  InventoryItem,
  InventorySummary,
  StockMovement,
  StockMovementInput,
  User,
} from "../types/inventory";

const user: User = {
  id: "user-1",
  name: "Alex Morgan",
  email: "alex.morgan@adb.org",
  role: "Store room officer",
  currentStoreName: "IT Store Room",
  permissions: ["inventory:read", "movement:read", "movement:create"],
};
const currentStoreName = user.currentStoreName;
let sessionUser: User | null = null;

let items: InventoryItem[] = [
  { id: "item-1", sku: "IT-LAP-001", name: "Business laptop", category: "Computers", location: currentStoreName, quantity: 12, unit: "units", reorderLevel: 5, updatedAt: "2025-01-18T10:00:00Z" },
  { id: "item-2", sku: "IT-MOU-002", name: "Wireless mouse", category: "Accessories", location: currentStoreName, quantity: 4, unit: "units", reorderLevel: 8, updatedAt: "2025-01-19T09:30:00Z" },
  { id: "item-3", sku: "IT-MON-003", name: "24-inch monitor", category: "Displays", location: currentStoreName, quantity: 7, unit: "units", reorderLevel: 4, updatedAt: "2025-01-17T13:15:00Z" },
  { id: "item-4", sku: "IT-KBD-004", name: "USB keyboard", category: "Accessories", location: currentStoreName, quantity: 3, unit: "units", reorderLevel: 6, updatedAt: "2025-01-20T08:45:00Z" },
  { id: "item-5", sku: "IT-DOCK-005", name: "USB-C docking station", category: "Accessories", location: currentStoreName, quantity: 9, unit: "units", reorderLevel: 4, updatedAt: "2025-01-16T11:00:00Z" },
  { id: "item-6", sku: "IT-HEAD-006", name: "Headset", category: "Accessories", location: currentStoreName, quantity: 2, unit: "units", reorderLevel: 5, updatedAt: "2025-01-20T09:00:00Z" },
];

let movements: StockMovement[] = [
  { id: "mov-1", itemId: "item-1", itemName: "Business laptop", type: "IN", quantity: 5, reference: "PAPER-REQ-2025-014", note: "Quarterly delivery", performedBy: user.name, createdAt: "2025-01-20T10:20:00Z" },
  { id: "mov-2", itemId: "item-2", itemName: "Wireless mouse", type: "OUT", quantity: 2, reference: "ISS-2025-031", note: "New employee setup", performedBy: user.name, createdAt: "2025-01-20T09:45:00Z" },
  { id: "mov-3", itemId: "item-4", itemName: "USB keyboard", type: "OUT", quantity: 1, reference: "ISS-2025-030", note: "", performedBy: "Jordan Lee", createdAt: "2025-01-19T15:15:00Z" },
  { id: "mov-4", itemId: "item-3", itemName: "24-inch monitor", type: "IN", quantity: 3, reference: "PAPER-REQ-2025-013", note: "Supplier delivery", performedBy: user.name, createdAt: "2025-01-19T11:30:00Z" },
  { id: "mov-5", itemId: "item-6", itemName: "Headset", type: "OUT", quantity: 2, reference: "ISS-2025-029", note: "Replacement equipment", performedBy: "Jordan Lee", createdAt: "2025-01-18T14:00:00Z" },
];

function getSummary(): InventorySummary {
  return {
    totalItems: items.length,
    totalUnits: items.reduce((total, item) => total + item.quantity, 0),
    lowStockCount: items.filter((item) => item.quantity <= item.reorderLevel).length,
    todayMovements: movements.filter((movement) =>
      movement.createdAt.startsWith(new Date().toISOString().slice(0, 10)),
    ).length,
  };
}

export const handlers = [
  http.get("/api/session", () => {
    if (!sessionUser) {
      return HttpResponse.json({ message: "Not signed in" }, { status: 401 });
    }
    return HttpResponse.json(sessionUser);
  }),
  http.post("/api/session/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json({ message: "Email and password are required" }, { status: 400 });
    }
    sessionUser = user;
    return HttpResponse.json(sessionUser);
  }),
  http.post("/api/session/logout", () => {
    sessionUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("/api/items", () => HttpResponse.json(items)),
  http.get("/api/movements", () => HttpResponse.json(movements)),
  http.get("/api/summary", () => HttpResponse.json(getSummary())),
  http.post("/api/movements", async ({ request }) => {
    const input = (await request.json()) as StockMovementInput;
    const item = items.find((candidate) => candidate.id === input.itemId);
    if (!item) {
      return HttpResponse.json({ message: "Item not found" }, { status: 404 });
    }
    if (
      input.type === "OUT" &&
      (!input.recipient?.trim() || !input.collectedBy?.trim())
    ) {
      return HttpResponse.json(
        { message: "Recipient and collector are required for stock OUT" },
        { status: 400 },
      );
    }
    if (input.type === "OUT" && input.quantity > item.quantity) {
      return HttpResponse.json({ message: "Quantity exceeds available stock" }, { status: 409 });
    }
    item.quantity += input.type === "IN" ? input.quantity : -input.quantity;
    item.updatedAt = new Date().toISOString();
    const movement: StockMovement = {
      ...input,
      id: `mov-${Date.now()}`,
      itemName: item.name,
      performedBy: user.name,
      createdAt: new Date().toISOString(),
    };
    movements = [movement, ...movements];
    return HttpResponse.json(movement, { status: 201 });
  }),
];
