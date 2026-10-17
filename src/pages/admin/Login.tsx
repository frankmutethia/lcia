import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthLayout from "@/components/admin/AuthLayout";
import { usePreview } from "@/components/admin/preview-context";
import { api, ApiError, passwordError, type AuthData } from "@/lib/api";
import {
  ErrorMessage,
  FieldErrors,
  fieldClass,
} from "@/components/api/Controls";
import "@/components/admin/admin.css";
export default function Login() {
  const { enter } = usePreview();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const invalid = passwordError(String(fields.get("password") ?? ""));
    if (invalid) {
      setError(
        new ApiError(400, invalid, [{ path: "password", message: invalid }]),
      );
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const { data } = await api<AuthData>("/auth/login", {
        method: "POST",
        body: { email: fields.get("email"), password: fields.get("password") },
      });
      enter(data);
      const from = location.state?.from;
      navigate(
        typeof from === "string" && /^\/admin(?:\/|$)/.test(from)
          ? from
          : "/admin",
        { replace: true },
      );
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue to your community workspace."
    >
      <form onSubmit={submit} className="mt-9 space-y-5" aria-busy={busy}>
        <label className="block text-sm font-medium">
          Email address
          <span className="relative mt-2 block">
            <Mail
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className={`${fieldClass} !mt-0 h-11 pl-10`}
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </span>
          <FieldErrors error={error} name="email" />
        </label>
        <div className="text-sm font-medium">
          <label htmlFor="login-password">Password</label>
          <div className="relative mt-2">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="login-password"
              className={`${fieldClass} !mt-0 h-11 pl-10 pr-12`}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={72}
            />
            <button
              type="button"
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FieldErrors error={error} name="password" />
        </div>
        <ErrorMessage error={error} />
        <Button disabled={busy} type="submit" className="h-11 w-full gap-2">
          {busy ? "Signing in…" : "Member Login"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
      <Link
        to="/forgot-password"
        className="mt-5 inline-block text-sm underline"
      >
        Forgot password?
      </Link>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        Use the account provided by your community administrator.
      </p>
    </AuthLayout>
  );
}
