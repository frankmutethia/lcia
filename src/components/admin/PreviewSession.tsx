import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  ApiError,
  setApiSession,
  setUnauthorizedHandler,
  type AuthData,
} from "@/lib/api";
import { PreviewContext, usePreview } from "./preview-context";
export function PreviewProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["auth"],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api<AuthData>("/auth/me", { signal });
        setApiSession(data.csrfToken);
        return data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60000,
  });
  useEffect(() => {
    setUnauthorizedHandler(() => {
      cache.setQueryData(["auth"], null);
      cache.removeQueries({ queryKey: ["admin"] });
    });
    return () => setUnauthorizedHandler(() => {});
  }, [cache]);
  function enter(session: AuthData) {
    setApiSession(session.csrfToken);
    cache.setQueryData(["auth"], session);
  }
  async function leave() {
    await api("/auth/logout", { method: "POST" });
    setApiSession("");
    cache.setQueryData(["auth"], null);
    cache.removeQueries({ queryKey: ["admin"] });
  }
  return (
    <PreviewContext.Provider
      value={{
        active: !!query.data?.user,
        loading: query.isPending,
        user: query.data?.user ?? null,
        enter,
        leave,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}
export function PreviewGate() {
  const { active, loading } = usePreview();
  const location = useLocation();
  if (loading)
    return (
      <p role="status" className="p-8">
        Checking staff session…
      </p>
    );
  return active ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
