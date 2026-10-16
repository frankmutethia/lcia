import { useQuery } from "@tanstack/react-query";
import { api, type ApiDocument } from "./api";
export type HomeData = {
  upcomingEvents: ApiDocument[];
  featuredEvents: ApiDocument[];
  albums: ApiDocument[];
  testimonials: ApiDocument[];
  businesses: ApiDocument[];
};
export function usePublicHome() {
  return useQuery({
    queryKey: ["public", "home"],
    queryFn: () => api<HomeData>("/public/home"),
    staleTime: 30000,
    retry: false,
  });
}
