import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/admin-auth.server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AdminLoginResult = { success: boolean; message: string };

export async function handleAdminLogin(rawEmail: string, rawPassword: string): Promise<AdminLoginResult> {
  const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!parsed.success) {
    return { success: false, message: "Please enter a valid email and password." };
  }

  const ok = await verifyAdminCredentials(parsed.data.email.trim(), parsed.data.password);
  if (!ok) {
    return { success: false, message: "Invalid admin credentials." };
  }

  return { success: true, message: "Signed in." };
}
