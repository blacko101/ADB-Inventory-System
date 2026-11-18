import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownToLine, ArrowUpFromLine, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, PageTitle, StockBadge, Button } from "../../components/ui";
import { formatDate, formatTime } from "../../lib/format";
import { inventoryApi } from "./api";
import type { InventoryItem } from "../../types/inventory";

function useInventory() {
  const items = useQuery({ queryKey: ["items"], queryFn: inventoryApi.getItems });
  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: inventoryApi.getSummary,
  });
  const movements = useQuery({
    queryKey: ["movements"],
    queryFn: inventoryApi.getMovements,
  });
  return { items, summary, movements };
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-8 text-center">
      <p className="font-semibold text-ink">Couldn’t load inventory</p>
      <p className="mt-1 text-sm text-muted">
        Check your connection and try again.
      </p>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function ItemTable({ items }: { items: InventoryItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-6 py-3.5">Item</th>
            <th className="px-4 py-3.5">Category</th>
            <th className="px-4 py-3.5">Location</th>
            <th className="px-4 py-3.5">Available</th>
            <th className="px-6 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item) => {
            const low = item.quantity <= item.reorderLevel;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-xs text-muted">{item.sku}</p>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {item.category}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {item.location}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-ink">
                    {item.quantity}
                  </span>{" "}
                  <span className="text-xs text-muted">{item.unit}</span>
                </td>
                <td className="px-6 py-4">
                  <StockBadge low={low} />
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted">
                No items match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function OverviewPage({ storeName }: { storeName: string }) {
  const { items, summary, movements } = useInventory();
  const retry = () => {
    void items.refetch();
    void summary.refetch();
    void movements.refetch();
  };
  const isError = items.isError || summary.isError || movements.isError;
  const lowStock = (items.data ?? []).filter(
    (item) => item.quantity <= item.reorderLevel,
  );
  const stats = [
    { label: "Tracked items", value: summary.data?.totalItems, detail: storeName },
    { label: "Units in stock", value: summary.data?.totalUnits, detail: "Across all items" },
    { label: "Low-stock items", value: summary.data?.lowStockCount, detail: "At or below reorder level", warn: true },
    { label: "Movements today", value: summary.data?.todayMovements, detail: "IN and OUT records" },
  ];

  return (
    <>
      <PageTitle
        title="Overview"
        description={`A quick look at inventory in ${storeName}.`}
      />
      {isError ? (
        <Card><ErrorState onRetry={retry} /></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-sm font-medium text-muted">{stat.label}</p>
                <p className={`mt-4 text-3xl font-bold tracking-tight ${stat.warn && (stat.value ?? 0) > 0 ? "text-amber-600" : "text-ink"}`}>
                  {stat.value ?? "—"}
                </p>
                <p className="mt-2 text-xs text-slate-400">{stat.detail}</p>
              </Card>
            ))}
          </div>
          {lowStock.length > 0 && (
            <Card className="mt-6 border-amber-100 bg-amber-50/70 p-5">
              <p className="font-semibold text-amber-900">Needs attention</p>
              <p className="mt-1 text-sm text-amber-800">
                {lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or
                below the reorder level:{" "}
                {lowStock.map((item) => item.name).join(", ")}.
              </p>
            </Card>
          )}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <h2 className="font-bold text-ink">Recent movements</h2>
                  <p className="mt-1 text-xs text-muted">Latest stock activity</p>
                </div>
              </div>
              <MovementRows movements={(movements.data ?? []).slice(0, 5)} />
            </Card>
            <Card className="overflow-hidden">
              <div className="px-6 py-5">
                <h2 className="font-bold text-ink">Low-stock watch</h2>
                <p className="mt-1 text-xs text-muted">Items to review for replenishment</p>
              </div>
              <div className="divide-y divide-slate-50">
                {lowStock.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">{item.sku}</p>
                    </div>
                    <p className="text-sm font-semibold text-amber-700">
                      {item.quantity} <span className="font-normal text-muted">{item.unit}</span>
                    </p>
                  </div>
                ))}
                {lowStock.length === 0 && (
                  <p className="px-6 pb-6 text-sm text-muted">No items need replenishment.</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

export function ItemsPage() {
  const { items } = useInventory();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items.data ?? [];
    return (items.data ?? []).filter((item) =>
      [item.name, item.sku, item.category, item.location].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [items.data, search]);

  return (
    <>
      <PageTitle title="Items & stock" description="Current quantities and reorder status for each item." />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-ink">Items in current store</h2>
            <p className="mt-1 text-xs text-muted">{items.data?.length ?? 0} items tracked</p>
          </div>
          <label className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search items"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search items..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </label>
        </div>
        {items.isError ? <ErrorState onRetry={() => void items.refetch()} /> : items.isPending ? (
          <p className="p-8 text-center text-sm text-muted">Loading items…</p>
        ) : <ItemTable items={filtered} />}
      </Card>
    </>
  );
}

export function MovementRows({
  movements,
}: {
  movements: Awaited<ReturnType<typeof inventoryApi.getMovements>>;
}) {
  return (
    <div className="divide-y divide-slate-50">
      {movements.map((movement) => {
        const isIn = movement.type === "IN";
        const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine;
        return (
          <div key={movement.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isIn ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
              <Icon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{movement.itemName}</p>
              <p className="mt-1 truncate text-xs text-muted">
                {movement.type === "IN" ? "Paper requisition" : "Reference"}: {movement.reference || "None"}
                {movement.recipient ? ` · To ${movement.recipient}` : ""}
                {movement.collectedBy ? ` · Collected by ${movement.collectedBy}` : ""}
                {" · "}{formatDate(movement.createdAt)}
              </p>
            </div>
            <span className={`shrink-0 text-sm font-bold ${isIn ? "text-emerald-700" : "text-orange-700"}`}>
              {isIn ? "+" : "−"}{movement.quantity}
            </span>
          </div>
        );
      })}
      {movements.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted">No movements recorded yet.</p>}
    </div>
  );
}

export function MovementsPage() {
  const { movements } = useInventory();
  return (
    <>
      <PageTitle title="Movement history" description="A record of stock received and issued from the store room." />
      <Card className="overflow-hidden">
        <div className="px-6 py-5">
          <h2 className="font-bold text-ink">All movements</h2>
          <p className="mt-1 text-xs text-muted">Showing the latest stock activity</p>
        </div>
        {movements.isError ? <ErrorState onRetry={() => void movements.refetch()} /> : movements.isPending ? (
          <p className="p-8 text-center text-sm text-muted">Loading movements…</p>
        ) : (
          <>
            <div className="hidden grid-cols-[1fr_100px_100px_140px_160px] border-y border-slate-100 bg-slate-50/70 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span>Item / reference</span><span>Type</span><span>Quantity</span><span>Performed by</span><span>Date & time</span>
            </div>
            {movements.data?.map((movement) => (
              <div key={movement.id} className="grid gap-2 border-b border-slate-50 px-6 py-4 md:grid-cols-[1fr_100px_100px_140px_160px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{movement.itemName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {movement.type === "IN" ? "Paper requisition" : "Reference"}: {movement.reference || "None"}
                    {movement.note ? ` · ${movement.note}` : ""}
                    {movement.recipient ? ` · To ${movement.recipient}` : ""}
                    {movement.collectedBy ? ` · Collected by ${movement.collectedBy}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-bold ${movement.type === "IN" ? "text-emerald-700" : "text-orange-700"}`}>{movement.type === "IN" ? "Stock IN" : "Stock OUT"}</span>
                <span className="text-sm font-semibold text-ink">{movement.quantity}</span>
                <span className="text-sm text-slate-600">{movement.performedBy}</span>
                <span className="text-xs text-muted">{formatDate(movement.createdAt)} · {formatTime(movement.createdAt)}</span>
              </div>
            ))}
            {movements.data?.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted">No movements recorded yet.</p>}
          </>
        )}
      </Card>
    </>
  );
}

const movementSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().int().positive("Enter a quantity greater than zero"),
  reference: z.string().trim().min(1, "Enter a reference").max(100),
  note: z.string().trim().max(250),
  recipient: z.string().trim().optional(),
  collectedBy: z.string().trim().optional(),
}).superRefine((movement, context) => {
  if (movement.type !== "OUT") return;
  if (!movement.recipient) {
    context.addIssue({
      code: "custom",
      path: ["recipient"],
      message: "Enter the receiving branch or unit",
    });
  }
  if (!movement.collectedBy) {
    context.addIssue({
      code: "custom",
      path: ["collectedBy"],
      message: "Enter who collected the item",
    });
  }
});

export function StockPage({ storeName }: { storeName: string }) {
  const queryClient = useQueryClient();
  const { items } = useInventory();
  const [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<
    z.input<typeof movementSchema>,
    unknown,
    z.output<typeof movementSchema>
  >({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "IN",
      note: "",
      recipient: "",
      collectedBy: "",
    },
    shouldUnregister: true,
  });
  const type = watch("type");
  const mutation = useMutation({
    mutationFn: inventoryApi.createMovement,
    onSuccess: async (movement) => {
      setSuccess(`Stock ${movement.type} recorded successfully.`);
      reset({
        itemId: "",
        type,
        quantity: 1,
        reference: "",
        note: "",
        recipient: "",
        collectedBy: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["movements"] }),
      ]);
    },
    onError: (error) => {
      setError("root.server", {
        message: error instanceof Error ? error.message : "Unable to save movement",
      });
    },
  });

  return (
    <>
      <PageTitle title="Record stock movement" description={`Record stock received into or issued from ${storeName}.`} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <Card className="p-5 sm:p-7">
          <form
            onSubmit={handleSubmit((values) => {
              setSuccess("");
              mutation.mutate(values);
            })}
            className="space-y-5"
          >
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Movement type</p>
              <div className="grid grid-cols-2 gap-3">
                {(["IN", "OUT"] as const).map((option) => (
                  <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${type === option ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-slate-200 hover:bg-slate-50"}`}>
                    <input
                      type="radio"
                      value={option}
                      {...register("type", {
                        onChange: (event) => {
                          if (event.target.value === "IN") {
                            setValue("recipient", "");
                            setValue("collectedBy", "");
                          }
                        },
                      })}
                      className="accent-brand"
                    />
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${option === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                      {option === "IN" ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-ink">Stock {option}</span>
                      <span className="mt-0.5 block text-xs text-muted">{option === "IN" ? "Receive stock" : "Issue stock"}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Item
              <select {...register("itemId")} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/15">
                <option value="">Select an item</option>
                {(items.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
              </select>
              {errors.itemId && <span className="mt-1 block text-xs text-rose-600">{errors.itemId.message}</span>}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Quantity
                <input {...register("quantity")} type="number" min="1" step="1" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/15" />
                {errors.quantity && <span className="mt-1 block text-xs text-rose-600">{errors.quantity.message}</span>}
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {type === "IN" ? "Paper requisition number" : "Issue reference"}
                <input
                  {...register("reference")}
                  placeholder={type === "IN" ? "Enter the paper requisition number" : "e.g. ISS-2025-014"}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                />
                {errors.reference && <span className="mt-1 block text-xs text-rose-600">{errors.reference.message}</span>}
              </label>
            </div>
            {type === "OUT" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Receiving branch / unit
                  <input
                    {...register("recipient")}
                    aria-required="true"
                    placeholder="Enter branch or unit"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                  />
                  {errors.recipient && <span className="mt-1 block text-xs text-rose-600">{errors.recipient.message}</span>}
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Collected by
                  <input
                    {...register("collectedBy")}
                    aria-required="true"
                    placeholder="Enter collector's name"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                  />
                  {errors.collectedBy && <span className="mt-1 block text-xs text-rose-600">{errors.collectedBy.message}</span>}
                </label>
              </div>
            )}
            <label className="block text-sm font-semibold text-slate-700">
              Note <span className="font-normal text-muted">(optional)</span>
              <textarea {...register("note")} rows={3} placeholder={type === "IN" ? "Add details about the delivery..." : "Add details about the issue..."} className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15" />
              {errors.note && <span className="mt-1 block text-xs text-rose-600">{errors.note.message}</span>}
            </label>
            {errors.root?.server && <p role="alert" className="text-sm text-rose-600">{errors.root.server.message}</p>}
            {success && <p role="status" className="text-sm font-medium text-emerald-700">{success}</p>}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" disabled={mutation.isPending || items.isPending}>
                {mutation.isPending ? "Saving…" : `Record stock ${type}`}
              </Button>
            </div>
          </form>
        </Card>
        <Card className="h-fit p-5 sm:p-6">
          <h2 className="font-bold text-ink">Before you record</h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-muted">
            <p className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><span><strong className="text-slate-700">Stock IN</strong> increases available quantity after delivery or return.</span></p>
            <p className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" /><span><strong className="text-slate-700">Stock OUT</strong> issues quantity from the current balance. The server validates available stock.</span></p>
            <p className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-accent" /><span>Use a traceable reference so the movement can be reconciled later.</span></p>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            The backend remains authoritative for stock balances, permissions, and audit history.
          </div>
        </Card>
      </div>
    </>
  );
}

export function CloseNotice({ onClose }: { onClose: () => void }) {
  return <button aria-label="Dismiss notice" onClick={onClose}><X size={14} /></button>;
}
