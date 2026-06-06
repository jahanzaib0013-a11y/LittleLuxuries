import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, ShieldCheck, PawPrint, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { FieldError, inputWithError } from "@/components/field-error";
import { validateEmail, validateRequired } from "@/lib/form-validation";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Portal Access — Little Luxuries" },
      { name: "description", content: "Secure admin login for the Little Luxuries boutique team." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen w-full grid place-items-center bg-linear-to-br from-[oklch(0.98_0.01_300)] via-[oklch(0.97_0.015_320)] to-[oklch(0.96_0.02_25)] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-card shadow-(--shadow-card) grid place-items-center mb-8">
          <PawPrint className="h-9 w-9 text-primary" />
        </div>

        <h1 className="font-serif text-4xl text-foreground">Admin Portal Access</h1>
        <p className="mt-3 text-xs tracking-[0.2em] text-muted-foreground">
          LITTLE LUXURIES BABY GARMENTS
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const errors: { email?: string; password?: string } = {
              email: validateEmail(email),
              password: validateRequired(password, "Password"),
            };
            if (errors.email || errors.password) {
              setFieldErrors(errors);
              return;
            }
            setFieldErrors({});
            setIsSubmitting(true);
            try {
              const res = await fetch("/api/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
              });
              const result = (await res.json()) as { success?: boolean; message?: string };
              if (result.success) {
                localStorage.setItem("isAuthenticated", "true");
                navigate({ to: "/dashboard" });
              } else {
                setError(result.message || "Invalid admin credentials");
              }
            } catch {
              setError("Could not reach the server. Restart the dev server and try again.");
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 text-left space-y-5"
        >
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs tracking-[0.15em] uppercase text-foreground/70"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@littleluxuries.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className={inputWithError(
                  Boolean(fieldErrors.email),
                  "pl-11 h-12 bg-muted/60 border-0 rounded-xl",
                )}
              />
              <FieldError message={fieldErrors.email} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="password"
                className="text-xs tracking-[0.15em] uppercase text-foreground/70"
              >
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-[11px] tracking-[0.15em] uppercase text-(--color-gold-foreground) hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              className={inputWithError(
                Boolean(fieldErrors.password),
                "h-12 bg-muted/60 border-0 rounded-xl",
              )}
            />
            <FieldError message={fieldErrors.password} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-full text-sm tracking-wide"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in…
              </>
            ) : (
              "Login to Dashboard"
            )}
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Secure Session for Little Luxuries Team
        </div>

        <Link to="/" className="mt-6 inline-block text-xs text-muted-foreground hover:text-primary">
          ← Back to storefront
        </Link>
      </div>
    </div>
  );
}
