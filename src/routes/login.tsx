import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, ShieldCheck, PawPrint } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-[oklch(0.98_0.01_300)] via-[oklch(0.97_0.015_320)] to-[oklch(0.96_0.02_25)] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-card shadow-[var(--shadow-card)] grid place-items-center mb-8">
          <PawPrint className="h-9 w-9 text-primary" />
        </div>

        <h1 className="font-serif text-4xl text-foreground">Admin Portal Access</h1>
        <p className="mt-3 text-xs tracking-[0.2em] text-muted-foreground">
          LITTLE LUXURIES BABY GARMENTS
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
          className="mt-10 bg-card rounded-3xl shadow-[var(--shadow-soft)] p-8 text-left space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs tracking-[0.15em] uppercase text-foreground/70">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@littleluxuries.com"
                className="pl-11 h-12 bg-muted/60 border-0 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs tracking-[0.15em] uppercase text-foreground/70">
                Password
              </Label>
              <button type="button" className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-gold-foreground)] hover:underline">
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-11 h-12 bg-muted/60 border-0 rounded-xl"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-full text-sm tracking-wide">
            Login to Dashboard
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-gold)]" />
          Secure Session for Little Luxuries Team
        </div>

        <Link to="/" className="mt-6 inline-block text-xs text-muted-foreground hover:text-primary">
          ← Back to storefront
        </Link>
      </div>
    </div>
  );
}
