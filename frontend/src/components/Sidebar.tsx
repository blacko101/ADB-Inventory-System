import { NavLink } from "react-router-dom";
import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  PackagePlus,
  Settings2,
} from "lucide-react";
import { hasPermissions } from "../lib/permissions";
import type { Permission, User } from "../types/inventory";

interface WorkspaceLink {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  requiredPermissions: readonly Permission[];
}

export const workspaceLinks = [
  {
    to: "/",
    label: "Overview",
    icon: LayoutDashboard,
    end: true,
    requiredPermissions: ["inventory:read"],
  },
  {
    to: "/items",
    label: "Items & stock",
    icon: Boxes,
    requiredPermissions: ["inventory:read"],
  },
  {
    to: "/movements",
    label: "Movement history",
    icon: ArrowLeftRight,
    requiredPermissions: ["movement:read"],
  },
  {
    to: "/stock",
    label: "Record movement",
    icon: PackagePlus,
    requiredPermissions: ["inventory:read", "movement:create"],
  },
] as const satisfies readonly WorkspaceLink[];

export function Sidebar({ user }: { user: User }) {
  const links = workspaceLinks.filter((link) =>
    hasPermissions(user.permissions, link.requiredPermissions),
  );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white px-5 py-7 lg:flex lg:flex-col">
      <div className="mb-11 flex items-center gap-3 px-2">
        <img
          src="/agricultural-development-bank-logo.png"
          alt="Agricultural Development Bank"
          className="h-14 w-16 rounded-lg bg-white object-contain"
        />
        <div>
          <p className="font-bold tracking-tight text-ink">ADB Inventory</p>
          <p className="text-xs text-muted">{user.currentStoreName}</p>
        </div>
      </div>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Workspace
      </p>
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-slate-500 hover:bg-slate-50 hover:text-ink"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <Settings2 size={16} className="text-slate-400" />
          Inventory workspace
        </div>
        <p className="text-xs leading-5 text-muted">
          Current store: {user.currentStoreName}
        </p>
      </div>
    </aside>
  );
}
