import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getServerAdminEmail,
  getServerAdminPassword,
  isAdminEmail,
} from "@/lib/admin-auth-env.server";
import { serverEnv } from "@/lib/server-dotenv.server";

const scryptAsync = promisify(scrypt);

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const SETTING_PASSWORD_HASH = "admin_password_hash";
const SETTING_RESET_TOKEN_HASH = "admin_reset_token_hash";
const SETTING_RESET_TOKEN_EXPIRES = "admin_reset_token_expires";

async function authFilePath(): Promise<string> {
  const { resolve } = await import("node:path");
  return resolve(process.cwd(), "data/admin-auth.json");
}

type AuthFileState = {
  passwordHash?: string;
  resetTokenHash?: string;
  resetTokenExpires?: string;
};

type AuthState = {
  passwordHash: string | null;
  resetTokenHash: string | null;
  resetTokenExpires: string | null;
};

function getServiceSupabase(): SupabaseClient | null {
  const url = serverEnv("SUPABASE_URL") ?? serverEnv("VITE_SUPABASE_URL");
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readAuthFile(): Promise<AuthFileState> {
  const { existsSync, readFileSync } = await import("node:fs");
  const filePath = await authFilePath();
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as AuthFileState;
  } catch {
    return {};
  }
}

async function writeAuthFile(state: AuthFileState): Promise<void> {
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  const filePath = await authFilePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

async function getSetting(key: string): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.error(`[admin-auth] read ${key}:`, error.message);
      return null;
    }
    return data?.value ?? null;
  }
  const file = await readAuthFile();
  if (key === SETTING_PASSWORD_HASH) return file.passwordHash ?? null;
  if (key === SETTING_RESET_TOKEN_HASH) return file.resetTokenHash ?? null;
  if (key === SETTING_RESET_TOKEN_EXPIRES) return file.resetTokenExpires ?? null;
  return null;
}

async function setSetting(key: string, value: string | null): Promise<void> {
  const supabase = getServiceSupabase();
  if (supabase) {
    if (value === null) {
      await supabase.from("store_settings").delete().eq("key", key);
      return;
    }
    await supabase.from("store_settings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    return;
  }
  const file = await readAuthFile();
  if (key === SETTING_PASSWORD_HASH) {
    if (value) file.passwordHash = value;
    else delete file.passwordHash;
  } else if (key === SETTING_RESET_TOKEN_HASH) {
    if (value) file.resetTokenHash = value;
    else delete file.resetTokenHash;
  } else if (key === SETTING_RESET_TOKEN_EXPIRES) {
    if (value) file.resetTokenExpires = value;
    else delete file.resetTokenExpires;
  }
  await writeAuthFile(file);
}

async function readAuthState(): Promise<AuthState> {
  const [passwordHash, resetTokenHash, resetTokenExpires] = await Promise.all([
    getSetting(SETTING_PASSWORD_HASH),
    getSetting(SETTING_RESET_TOKEN_HASH),
    getSetting(SETTING_RESET_TOKEN_EXPIRES),
  ]);
  return { passwordHash, resetTokenHash, resetTokenExpires };
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  try {
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resolveAppBaseUrl(requestOrigin?: string): string {
  const fromEnv = serverEnv("APP_URL") ?? serverEnv("VITE_APP_URL");
  const base = (fromEnv || requestOrigin || "http://localhost:8080").trim();
  return base.replace(/\/$/, "");
}

export async function ensureAdminPasswordHash(): Promise<boolean> {
  const state = await readAuthState();
  if (state.passwordHash) return true;

  const seed = getServerAdminPassword();
  if (!seed) return false;

  const hash = await hashAdminPassword(seed);
  await setSetting(SETTING_PASSWORD_HASH, hash);
  return true;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  if (!isAdminEmail(email)) return false;
  if (!(await ensureAdminPasswordHash())) return false;

  const state = await readAuthState();
  if (!state.passwordHash) return false;
  return verifyPasswordHash(password, state.passwordHash);
}

export async function setAdminPassword(password: string): Promise<void> {
  const hash = await hashAdminPassword(password);
  await setSetting(SETTING_PASSWORD_HASH, hash);
  await clearPasswordResetToken();
}

export async function clearPasswordResetToken(): Promise<void> {
  await Promise.all([
    setSetting(SETTING_RESET_TOKEN_HASH, null),
    setSetting(SETTING_RESET_TOKEN_EXPIRES, null),
  ]);
}

export async function createPasswordResetLink(baseUrl: string): Promise<string> {
  await ensureAdminPasswordHash();

  const token = randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  await setSetting(SETTING_RESET_TOKEN_HASH, tokenHash);
  await setSetting(SETTING_RESET_TOKEN_EXPIRES, expiresAt);

  const appBase = baseUrl.replace(/\/$/, "");
  return `${appBase}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  if (!token.trim()) return false;

  const state = await readAuthState();
  if (!state.resetTokenHash || !state.resetTokenExpires) return false;

  const expires = new Date(state.resetTokenExpires).getTime();
  if (Number.isNaN(expires) || expires < Date.now()) return false;

  const incoming = hashResetToken(token.trim());
  const stored = Buffer.from(state.resetTokenHash, "hex");
  const actual = Buffer.from(incoming, "hex");
  if (stored.length !== actual.length) return false;
  return timingSafeEqual(stored, actual);
}

export async function completePasswordReset(token: string, newPassword: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (newPassword.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }

  const valid = await isPasswordResetTokenValid(token);
  if (!valid) {
    return {
      success: false,
      message: "This reset link is invalid or has expired. Request a new one from the login page.",
    };
  }

  await setAdminPassword(newPassword);
  return { success: true, message: "Password updated. You can sign in with your new password." };
}

export function getAdminEmailForReset(): string | undefined {
  return getServerAdminEmail();
}
