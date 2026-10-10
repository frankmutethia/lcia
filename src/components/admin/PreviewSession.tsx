import { type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cmsRequest, type Session } from "@/lib/cms";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PreviewContext, usePreview } from "./preview-context";

export function PreviewProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["cms-session"], queryFn: () => cmsRequest<Session>("session"), retry: false });
  async function leave() {
    await cmsRequest("logout", {});
    cache.clear();
    cache.setQueryData(["cms-session"], { user: null, csrf: "" });
  }
  return (
    <PreviewContext.Provider
      value={{ active: !!query.data?.user, loading: query.isPending, user: query.data?.user ?? null, enter: () => { void cache.invalidateQueries({ queryKey: ["cms-session"] }); }, leave }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function PreviewGate() {
  const { active, loading } = usePreview();
  const location = useLocation();
  if (loading) return <p role="status" className="p-8">Checking staff session…</p>;
  return active ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
