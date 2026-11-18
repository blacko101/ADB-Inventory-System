import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { hasPermissions } from "../lib/permissions";
import type { User } from "../types/inventory";
import { Button } from "./ui";
import { workspaceLinks } from "./Sidebar";

export function Topbar({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await onLogout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Unable to sign out");
    }
  };

  return (
    <>
      <header className="flex h-[76px] items-center justify-between border-b border-slate-100 bg-white px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/agricultural-development-bank-logo.png"
            alt="Agricultural Development Bank"
            className="h-9 w-10 object-contain lg:hidden"
          />
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
            <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {user.currentStoreName}
          </span>
          <span className="text-xs text-slate-400 sm:hidden">{user.currentStoreName}</span>
        </div>
        <div className="flex items-center gap-3">
          {logoutError && <span role="alert" className="hidden text-xs text-rose-600 md:block">{logoutError}</span>}
          <Button
            variant="ghost"
            className="relative h-10 w-10 p-0"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-amber-500" />
          </Button>
          <div className="hidden h-8 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {user.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-[11px] text-muted">{user.role}</p>
            </div>
            <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
          </div>
          <Button
            variant="ghost"
            className="ml-1 h-9 w-9 p-0"
            aria-label="Sign out"
            onClick={() => void handleLogout()}
          >
            <LogOut size={17} />
          </Button>
        </div>
      </header>
      {menuOpen && (
        <nav className="space-y-1 border-b border-slate-100 bg-white px-5 py-3 lg:hidden">
          {workspaceLinks
            .filter((link) =>
              hasPermissions(user.permissions, link.requiredPermissions),
            )
            .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-brand/10 text-brand" : "text-slate-500"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
            ))}
        </nav>
      )}
    </>
  );
}
