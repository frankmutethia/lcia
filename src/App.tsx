import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SubTribesPage from "./pages/culture/SubTribesPage";
import TasteOfHomePage from "./pages/culture/TasteOfHomePage";
import StoriesPage from "./pages/culture/StoriesPage";
import LanguagePage from "./pages/culture/LanguagePage";
import { lazy, Suspense } from "react";
import {
  PreviewProvider,
  PreviewGate,
} from "./components/admin/PreviewSession";

const Login = lazy(() => import("./pages/admin/Login"));
const AdminShell = lazy(() => import("./components/admin/AdminShell"));
const Dashboard = lazy(() =>
  import("./components/admin/AdminContent").then((m) => ({
    default: m.Dashboard,
  })),
);
const EventsPage = lazy(() =>
  import("./components/admin/AdminContent").then((m) => ({
    default: m.EventsPage,
  })),
);
const GalleryPage = lazy(() =>
  import("./components/admin/AdminContent").then((m) => ({
    default: m.GalleryPage,
  })),
);
const TestimonialsPage = lazy(() =>
  import("./components/admin/AdminContent").then((m) => ({
    default: m.TestimonialsPage,
  })),
);
const CategoriesPage = lazy(() =>
  import("./components/admin/AdminContent").then((m) => ({
    default: m.CategoriesPage,
  })),
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <PreviewProvider>
          <Suspense
            fallback={
              <div
                role="status"
                className="flex min-h-screen items-center justify-center text-sm"
              >
                Loading workspace...
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<PreviewGate />}>
                <Route path="/admin" element={<AdminShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="gallery" element={<GalleryPage />} />
                  <Route path="testimonials" element={<TestimonialsPage />} />
                  <Route
                    path="business-categories"
                    element={<CategoriesPage />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
              <Route path="/" element={<Index />} />
              {/* Shareable links that open the home page scrolled to a section */}
              <Route path="/events" element={<Index scrollTo="events" />} />
              <Route path="/mulembe-night" element={<Index scrollTo="mulembe-night" />} />
              <Route path="/tickets" element={<Index scrollTo="tickets" />} />
              <Route path="/culture/sub-tribes" element={<SubTribesPage />} />
              <Route
                path="/culture/taste-of-home"
                element={<TasteOfHomePage />}
              />
              <Route path="/culture/stories" element={<StoriesPage />} />
              <Route path="/culture/language" element={<LanguagePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PreviewProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
