import { createContext, useContext } from "react";
import type { AuthData, StaffUser } from "@/lib/api";
export const PreviewContext = createContext({
  active: false,
  loading: true,
  user: null as StaffUser | null,
  enter: (_session: AuthData) => {
    void _session;
  },
  leave: async () => {},
});
export const usePreview = () => useContext(PreviewContext);
