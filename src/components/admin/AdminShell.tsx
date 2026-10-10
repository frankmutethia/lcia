import { Fragment, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  MessageSquareQuote,
  Shapes,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Sun,
  Moon,
  CircleHelp,
  ChevronDown,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreview } from "./preview-context";
import adminPortrait from "@/assets/admin-portrait.jpg";
import "./admin.css";

const nav = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Events & activities", to: "/admin/events", icon: CalendarDays },
  { label: "Community gallery", to: "/admin/gallery", icon: Images },
  {
    label: "Testimonials",
    to: "/admin/testimonials",
    icon: MessageSquareQuote,
  },
  {
    label: "Business categories",
    to: "/admin/business-categories",
    icon: Shapes,
  },
];

const adminNav = [
  { label: "User management", to: "/admin/users", icon: Users },
];

export default function AdminShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { leave, user } = usePreview();
  const [signOutError, setSignOutError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("mulembe-admin-theme") === "dark";
    } catch {
      return false;
    }
  });
  const theme = dark ? "dark" : "light";
  const current =
    [...nav, ...adminNav].find((item) => item.to === pathname)?.label ?? "Page not found";
  useEffect(() => {
    const previous = document.title;
    document.title = current + " | Mulembe Admin";
    window.scrollTo(0, 0);
    return () => {
      document.title = previous;
    };
  }, [current]);
  function toggleTheme() {
    setDark(!dark);
    try {
      localStorage.setItem("mulembe-admin-theme", dark ? "light" : "dark");
    } catch {
      /* Theme remains available for this visit. */
    }
  }
  async function signOut() {
    try {
    await leave();
    setMobileOpen(false);
    navigate("/login", { replace: true });
    } catch { setSignOutError("Could not sign out. Please try again."); }
  }
  function sidebar(compact: boolean) {
    return (
      <>
        <div
          className={
            "flex shrink-0 items-center border-b border-sidebar-border " +
            (compact
              ? "h-28 flex-col justify-center gap-2 px-2"
              : "h-20 justify-between gap-2 px-4")
          }
        >
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            title="Mulembe Community home"
            aria-label="Mulembe Community home"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
              <img
                src="/lcia-logo.jpg"
                alt=""
                className="h-full w-full scale-[1.55] object-contain"
              />
            </span>
            {!compact && (
              <span className="leading-tight">
                <strong className="block text-[15px]">Mulembe</strong>
                <span className="text-[10px] text-muted-foreground">
                  COMMUNITY NSW
                </span>
              </span>
            )}
          </Link>
          {compact ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 bg-background text-foreground shadow-sm"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              aria-expanded={false}
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="hidden h-9 w-9 shrink-0 bg-background text-foreground shadow-sm lg:inline-flex"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              aria-expanded={true}
            >
              <PanelLeftClose className="h-[18px] w-[18px]" />
            </Button>
          )}
        </div>
        <nav
          className="flex-1 space-y-1 px-3 pt-7"
          aria-label="Admin navigation"
        >
          {!compact && (
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase text-muted-foreground">
              Workspace
            </p>
          )}
          {[...nav, ...(user?.role === "administrator" ? adminNav : [])].map(({ label, to, icon: Icon }, index) => (
            <Fragment key={to}>
            {index === nav.length && (compact ? <div className="mx-3 my-3 border-t border-sidebar-border" /> : <p className="px-3 pb-3 pt-6 text-[10px] font-semibold uppercase text-muted-foreground">Administration</p>)}
            <NavLink
              end
              to={to}
              onClick={() => setMobileOpen(false)}
              title={compact ? label : undefined}
              aria-label={label}
              className={({ isActive }) =>
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-[13px] font-medium transition-colors " +
                (isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!compact && label}
            </NavLink>
            </Fragment>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/"
            title="View website"
            className="flex min-h-11 items-center gap-3 rounded-md px-3 text-[13px] text-muted-foreground hover:bg-sidebar-accent"
          >
            <ArrowUpRight className="h-[18px] w-[18px] shrink-0" />
            {!compact && "View website"}
          </Link>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!compact && "Sign out"}
          </button>
        </div>
      </>
    );
  }
  return (
    <div className="admin-ui flex min-h-screen" data-theme={theme}>
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <aside
        className={
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex " +
          (collapsed ? "w-[76px]" : "w-64")
        }
      >
        {sidebar(collapsed)}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-2 border-b border-border bg-background px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:hidden"
                  title="Open menu"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
                <Dialog.Content
                  data-theme={theme}
                  className="admin-ui fixed inset-y-0 left-0 z-50 flex w-72 max-w-[90vw] flex-col bg-sidebar shadow-xl"
                >
                  <Dialog.Title className="sr-only">
                    Workspace navigation
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Choose an admin section.
                  </Dialog.Description>
                  {sidebar(false)}
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-5 lg:hidden"
                      aria-label="Close menu"
                    >
                      <X />
                    </Button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="min-w-0 py-3">
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Admin workspace <span className="px-2">/</span>
                {current}
              </p>
              <h1 className="text-base font-semibold sm:mt-1 sm:text-xl">
                {current}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Help"
                  aria-label="Help"
                >
                  <CircleHelp className="h-[18px] w-[18px]" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Content
                  data-theme={theme}
                  className="admin-ui fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-popover p-6 shadow-xl"
                >
                  <Dialog.Title className="text-lg font-semibold">
                    Community support
                  </Dialog.Title>
                  <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
                    For account access or help with community records, contact
                    the Mulembe team.
                  </Dialog.Description>
                  <a
                    href="mailto:mulembecommunitysydneyau@gmail.com"
                    className="mt-5 block break-all text-sm text-primary underline"
                  >
                    mulembecommunitysydneyau@gmail.com
                  </a>
                  <Dialog.Close asChild>
                    <Button variant="outline" className="mt-6">
                      Close
                    </Button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <span className="mx-2 hidden h-7 w-px bg-border sm:block" />
            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 gap-2 px-1 sm:px-2"
                  aria-label="Admin profile"
                >
                  <img
                    src={adminPortrait}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <span className="hidden text-left leading-tight sm:block">
                    <strong className="block text-xs">{user?.name}</strong>
                    <span className="text-[11px] text-muted-foreground">
                      {user?.role}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-3 w-3 sm:block" />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content
                  data-theme={theme}
                  align="end"
                  sideOffset={8}
                  className="admin-ui z-50 min-w-52 rounded-md border border-border bg-popover p-2 shadow-lg"
                >
                  <Dropdown.Label className="px-3 py-2 text-xs text-muted-foreground">
                    Preview account
                  </Dropdown.Label>
                  <Dropdown.Separator className="my-1 h-px bg-border" />
                  <Dropdown.Item
                    onSelect={signOut}
                    className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm outline-none focus:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
        </header>
        <main
          id="admin-content"
          className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
        >
          {signOutError && <p role="alert" className="mb-4 text-red-700">{signOutError}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
