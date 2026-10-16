import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <main className="admin-ui flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 sm:p-9">
        <Link to="/" className="text-sm underline">
          Back to Mulembe Community
        </Link>
        <h1 className="mt-7 text-3xl font-bold">Member Login</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to manage your community website.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={busy}>
          <label className="block text-sm font-medium">
            Email address
            <input
              className={fieldClass}
              name="email"
              type="email"
              autoComplete="username"
              required
            />
            <FieldErrors error={error} name="email" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              className={fieldClass}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
            />
            <FieldErrors error={error} name="password" />
          </label>
          <ErrorMessage error={error} />
          <Button disabled={busy} type="submit" className="w-full">
            {busy ? "Signing in…" : "Member Login"}
          </Button>
        </form>
        <Link
          to="/forgot-password"
          className="mt-5 inline-block text-sm underline"
        >
          Forgot password?
        </Link>
      </div>
    </main>
  );
}
