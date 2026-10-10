import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreview } from "@/components/admin/preview-context";
import harbour from "@/assets/caleb-JmuyB_LibRo-unsplash.jpg";
import "@/components/admin/admin.css";
import { CMS_MODE, cmsRequest, type Session } from "@/lib/cms";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cache = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { enter } = usePreview();
  useEffect(() => {
    const previous = document.title;
    document.title = "Admin sign in | Mulembe Community NSW";
    window.scrollTo(0, 0);
    return () => {
      document.title = previous;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
    await cmsRequest<Session>("session");
    const session = await cmsRequest<Session>("login", { email: fields.get("email"), password: fields.get("password") });
    cache.setQueryData(["cms-session"], session);
    enter();
    const from = location.state?.from;
    navigate(
      typeof from === "string" && /^\/admin(?:\/|$)/.test(from)
        ? from
        : "/admin",
      { replace: true },
    );
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return (
    <div className="admin-ui grid min-h-screen lg:grid-cols-[52%_48%]">
      <div className="relative min-h-[260px] overflow-hidden lg:min-h-screen">
        <img
          src={harbour}
          alt="Sydney Opera House and Harbour Bridge"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-6 pb-7 pt-24 text-white lg:px-14 lg:pb-14">
          <p className="mb-3 text-xs font-bold uppercase">
            Mulembe Community NSW
          </p>
          <p className="max-w-lg text-2xl font-semibold leading-tight lg:text-4xl">
            Connected by heritage.
            <br />
            Growing together in Australia.
          </p>
        </div>
      </div>
      <div className="flex min-h-[620px] flex-col px-6 py-7 sm:px-12 lg:px-12 lg:py-10 xl:px-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <span className="brand-mark !h-8 !w-8 !text-base">M</span>Mulembe
            Community
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[410px] flex-1 flex-col justify-center py-12">
          <p className="mb-3 text-xs font-semibold uppercase text-primary">
            Admin workspace
          </p>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to continue to your community workspace.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs font-semibold"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@example.com"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-semibold"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 pl-10 pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-9 w-9"
                  onClick={() => setShow(!show)}
                  title={show ? "Hide password" : "Show password"}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                >
                  {show ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={busy} className="h-11 w-full gap-2">
              {busy ? "Signing in…" : "Staff Login"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            {CMS_MODE === "local"
              ? "Preview mode: sign in with any email and password. Your first sign-in becomes an administrator, and changes are saved only in this browser."
              : "Use the staff account provided by your community administrator."}
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          &copy; Mulembe Community NSW
        </p>
      </div>
    </div>
  );
}
