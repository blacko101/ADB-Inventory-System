export type StockMovementType = "IN" | "OUT";
export type Permission =
  | "inventory:read"
  | "movement:read"
  | "movement:create";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  storeId?: string;
  storeName?: string;
  locationId?: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: StockMovementType;
  quantity: number;
  reference: string;
  note: string;
  performedBy: string;
  createdAt: string;
  storeId?: string;
  storeName?: string;
  locationId?: string;
  locationName?: string;
  recipient?: string;
  collectedBy?: string;
}

export interface InventorySummary {
  totalItems: number;
  totalUnits: number;
  lowStockCount: number;
  todayMovements: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  currentStoreName: string;
  permissions: Permission[];
}

export interface StockMovementInput {
  itemId: string;
  type: StockMovementType;
  quantity: number;
  reference: string;
  note: string;
  recipient?: string;
  collectedBy?: string;
}
