/** Server env lookup without top-level `node:fs` (safe if this module is analyzed on the client). */

export function serverEnv(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== "") return fromProcess;

  const meta = import.meta.env as Record<string, string | boolean | undefined>;
  const direct = meta[key];
  if (typeof direct === "string" && direct !== "") return direct;

  if (!key.startsWith("VITE_")) {
    const viteAlias = meta[`VITE_${key}`];
    if (typeof viteAlias === "string" && viteAlias !== "") return viteAlias;
  }

  return undefined;
}
