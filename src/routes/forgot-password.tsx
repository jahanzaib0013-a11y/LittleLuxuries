import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ShieldCheck, PawPrint, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, inputWithError } from "@/components/field-error";
import { validateEmail } from "@/lib/form-validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Little Luxuries" },
      { name: "description", content: "Reset your admin password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    setEmailError(undefined);
    setIsSending(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = (await res.json()) as { success?: boolean; message?: string };

      if (!result || typeof result !== "object") {
        setError("Unexpected server response. Restart the dev server and try again.");
        setSubmitted(false);
      } else if (result.success) {
        setSubmitted(true);
        setError("");
      } else {
        setError(result.message || "Failed to send email.");
        setSubmitted(false);
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Restart the dev server and try again.");
      setSubmitted(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-linear-to-br from-[oklch(0.98_0.01_300)] via-[oklch(0.97_0.015_320)] to-[oklch(0.96_0.02_25)] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-card shadow-(--shadow-card) grid place-items-center mb-8">
          <PawPrint className="h-9 w-9 text-primary" />
        </div>

        <h1 className="font-serif text-4xl text-foreground">Reset Password</h1>
        <p className="mt-3 text-xs tracking-[0.2em] text-muted-foreground">
          LITTLE LUXURIES BABY GARMENTS
        </p>

        {submitted ? (
          <div className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 text-center space-y-5">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-serif text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If <strong>{email.trim()}</strong> is your admin account, we sent a secure reset link.
              Open the email and follow the link to set a new password. The link expires in one
              hour. Check your spam folder if you do not see it.
            </p>
            <Button asChild className="w-full h-12 rounded-full mt-4 text-sm tracking-wide">
              <Link to="/login">Return to Login</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 bg-card rounded-3xl shadow-(--shadow-soft) p-8 text-left space-y-5"
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs tracking-[0.15em] uppercase text-foreground/70"
              >
                Admin Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(undefined);
                  }}
                  placeholder="name@littleluxuries.com"
                  required
                  disabled={isSending}
                  aria-invalid={Boolean(emailError)}
                  className={inputWithError(
                    Boolean(emailError),
                    "pl-11 h-12 bg-muted/60 border-0 rounded-xl",
                  )}
                />
              </div>
              <FieldError message={emailError} />
              {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSending}
              className="w-full h-12 rounded-full text-sm tracking-wide"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending…
                </>
              ) : (
                "Send Reset Instructions"
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
