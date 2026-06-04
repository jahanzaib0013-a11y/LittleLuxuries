import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PawPrint, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { FieldError } from "@/components/field-error";
import { validateMinLength } from "@/lib/form-validation";

type ResetSearch = {
  token: string;
};

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Set New Password — Little Luxuries" },
      { name: "description", content: "Set a new admin password for Little Luxuries." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/reset-password?token=${encodeURIComponent(token)}`,
        );
        const data = (await res.json()) as { valid?: boolean };
        if (!cancelled) {
          setTokenValid(Boolean(data.valid));
        }
      } catch {
        if (!cancelled) setTokenValid(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors: { password?: string; confirm?: string } = {
      password: validateMinLength(password, 8, "Password"),
      confirm: !confirmPassword.trim()
        ? "Please confirm your password."
        : password !== confirmPassword
          ? "Passwords do not match."
          : undefined,
    };
    if (errors.password || errors.confirm) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = (await res.json()) as { success?: boolean; message?: string };

      if (result.success) {
        setDone(true);
      } else {
        setError(result.message || "Could not reset password.");
      }
    } catch {
      setError("Could not reach the server. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-linear-to-br from-[oklch(0.98_0.01_300)] via-[oklch(0.97_0.015_320)] to-[oklch(0.96_0.02_25)] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-card shadow-(--shadow-card) grid place-items-center mb-8">
          <PawPrint className="h-9 w-9 text-primary" />
        </div>

        <h1 className="font-serif text-4xl text-foreground">New Password</h1>
        <p className="mt-3 text-xs tracking-[0.2em] text-muted-foreground">
          LITTLE LUXURIES BABY GARMENTS
        </p>

        {checking ? (
          <div className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying reset link…
          </div>
        ) : done ? (
          <div className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 text-center space-y-5">
            <h2 className="text-xl font-serif text-foreground">Password updated</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your admin password has been changed. Sign in with your new password.
            </p>
            <Button
              className="w-full h-12 rounded-full text-sm tracking-wide"
              onClick={() => navigate({ to: "/login" })}
            >
              Go to login
            </Button>
          </div>
        ) : !tokenValid ? (
          <div className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 text-center space-y-5">
            <h2 className="text-xl font-serif text-foreground">Link expired or invalid</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This reset link is no longer valid. Request a new one from the login page.
            </p>
            <Button asChild className="w-full h-12 rounded-full text-sm tracking-wide">
              <Link to="/forgot-password">Request new link</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 text-left space-y-5"
          >
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs tracking-[0.15em] uppercase text-foreground/70"
              >
                New password
              </Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="At least 8 characters"
                required
                minLength={8}
                disabled={isSubmitting}
                className="h-12 bg-muted/60 border-0 rounded-xl"
              />
              <FieldError message={fieldErrors.password} />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm"
                className="text-xs tracking-[0.15em] uppercase text-foreground/70"
              >
                Confirm password
              </Label>
              <PasswordInput
                id="confirm"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                }}
                placeholder="Repeat password"
                required
                minLength={8}
                disabled={isSubmitting}
                className="h-12 bg-muted/60 border-0 rounded-xl"
              />
              <FieldError message={fieldErrors.confirm} />
              {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full text-sm tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Set new password"
              )}
            </Button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Secure Session for Little Luxuries Team
        </div>

        <Link
          to="/login"
          className="mt-6 inline-flex items-center text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to login
        </Link>
      </div>
    </div>
  );
}
