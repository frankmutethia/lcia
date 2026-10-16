import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, passwordError, setApiSession } from "@/lib/api";
import {
  ErrorMessage,
  FieldErrors,
  fieldClass,
} from "@/components/api/Controls";
import { Button } from "@/components/ui/button";
declare global {
  interface Window {
    __mulembeResetToken?: string;
  }
}
export default function PasswordPage({
  mode,
}: {
  mode: "forgot" | "reset" | "change";
}) {
  const [token] = useState(() => {
    const value = window.__mulembeResetToken ?? "";
    delete window.__mulembeResetToken;
    return value;
  });
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const cache = useQueryClient();
  const navigate = useNavigate();
  const invalid =
    mode === "reset" &&
    (!/^[a-f0-9]{64}$/i.test(token) ||
      (error instanceof ApiError && error.status === 400));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (
      mode !== "forgot" &&
      (passwordError(password) || password !== values.get("confirm"))
    ) {
      setError(new Error(passwordError(password) || "Passwords do not match."));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const body =
        mode === "forgot"
          ? { email: values.get("email") }
          : mode === "reset"
            ? { token, password }
            : { currentPassword: values.get("currentPassword"), password };
      const result = await api<{ message: string }>(
        `/auth/${mode === "forgot" ? "forgot-password" : mode === "reset" ? "reset-password" : "change-password"}`,
        { method: mode === "change" ? "PATCH" : "POST", body },
      );
      setMessage(result.data.message);
      if (mode === "change") {
        setApiSession("");
        cache.setQueryData(["auth"], null);
        cache.removeQueries({ queryKey: ["admin"] });
        navigate("/login", { replace: true });
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-12">
      <h1 className="text-3xl font-bold">
        {mode === "forgot"
          ? "Forgot password"
          : mode === "reset"
            ? "Set your password"
            : "Change password"}
      </h1>
      {message ? (
        <p role="status" className="my-6 rounded border p-4">
          {message}
        </p>
      ) : invalid ? (
        <p role="alert" className="my-6">
          This link is invalid or expired (links last 15 minutes).{" "}
          <Link to="/forgot-password" className="underline">
            Request a new link
          </Link>
        </p>
      ) : (
        <form onSubmit={submit} className="my-6 space-y-5" aria-busy={busy}>
          {mode === "forgot" ? (
            <label className="block">
              Email address
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className={fieldClass}
              />
              <FieldErrors error={error} name="email" />
            </label>
          ) : (
            <>
              {mode === "change" && (
                <label className="block">
                  Current password
                  <input
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    required
                    className={fieldClass}
                  />
                  <FieldErrors error={error} name="currentPassword" />
                </label>
              )}
              <label className="block">
                New password
                <input
                  type="password"
                  name="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  className={fieldClass}
                />
                <FieldErrors error={error} name="password" />
              </label>
              <label className="block">
                Confirm password
                <input
                  type="password"
                  name="confirm"
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  className={fieldClass}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Use 12–72 characters (up to 72 UTF-8 bytes).
              </p>
            </>
          )}
          <ErrorMessage error={error} />
          <Button disabled={busy} type="submit">
            {busy
              ? "Please wait…"
              : mode === "forgot"
                ? "Send reset link"
                : "Save password"}
          </Button>
        </form>
      )}
      <Link className="mt-5 inline-block underline" to="/login">
        Back to Member Login
      </Link>
    </main>
  );
}
