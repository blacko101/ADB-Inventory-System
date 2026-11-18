import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { LoginPage } from "./features/auth/LoginPage";
import { authApi } from "./features/auth/api";
import {
  ItemsPage,
  MovementsPage,
  OverviewPage,
  StockPage,
} from "./features/inventory/InventoryPages";
import { hasPermissions } from "./lib/permissions";
import { workspaceLinks } from "./components/Sidebar";
import type { ReactNode } from "react";

export default function App() {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: authApi.getSession,
    retry: false,
  });
  const user = session.data;

  const login = async (email: string, password: string) => {
    const signedInUser = await authApi.login(email, password);
    queryClient.setQueryData(["session"], signedInUser);
    return signedInUser;
  };
  const logout = async () => {
    await authApi.logout();
    queryClient.clear();
  };

  if (session.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Loading workspace…
      </main>
    );
  }

  if (!user) return <LoginPage onLogin={login} />;

  const pages: Record<(typeof workspaceLinks)[number]["to"], ReactNode> = {
    "/": <OverviewPage storeName={user.currentStoreName} />,
    "/items": <ItemsPage />,
    "/movements": <MovementsPage />,
    "/stock": <StockPage storeName={user.currentStoreName} />,
  };
  const firstAllowedPath = workspaceLinks.find((link) =>
    hasPermissions(user.permissions, link.requiredPermissions),
  )?.to;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <Topbar user={user} onLogout={logout} />
        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
          <Routes>
            {workspaceLinks.map(({ to, requiredPermissions }) => (
              <Route
                key={to}
                path={to}
                element={
                  hasPermissions(user.permissions, requiredPermissions)
                    ? pages[to]
                    : firstAllowedPath
                      ? <Navigate to={firstAllowedPath} replace />
                      : <p role="status">No inventory sections are available for this account.</p>
                }
              />
            ))}
            <Route path="*" element={<Navigate to={firstAllowedPath ?? "/"} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
