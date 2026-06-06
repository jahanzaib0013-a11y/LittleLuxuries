import { serverEnv } from "@/lib/server-dotenv.server";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getServerAdminEmail(): string | undefined {
  const raw = serverEnv("ADMIN_EMAIL") ?? serverEnv("VITE_ADMIN_EMAIL");
  return raw?.trim() || undefined;
}

export function getServerAdminPassword(): string | undefined {
  const raw = serverEnv("ADMIN_PASSWORD") ?? serverEnv("VITE_ADMIN_PASSWORD");
  return raw || undefined;
}

export function isAdminEmail(input: string): boolean {
  const admin = getServerAdminEmail();
  if (!admin) return false;
  return normalizeEmail(input) === normalizeEmail(admin);
}
