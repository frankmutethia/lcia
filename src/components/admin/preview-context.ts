import { createContext, useContext } from "react";
import type { StaffUser } from "@/lib/cms";

export const PreviewContext = createContext({
  active: false,
  loading: true,
  user: null as StaffUser | null,
  enter: () => {},
  leave: async () => {},
});
export const usePreview = () => useContext(PreviewContext);
