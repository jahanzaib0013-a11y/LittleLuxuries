// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";

function loadDotenvIntoProcess(mode: string) {
  const fromFile = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(fromFile)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function dotenvServerPlugin(): Plugin {
  return {
    name: "dotenv-server",
    config(_config, { mode }) {
      loadDotenvIntoProcess(mode);
    },
    configureServer() {
      loadDotenvIntoProcess(process.env.NODE_ENV === "production" ? "production" : "development");
    },
  };
}

loadDotenvIntoProcess(process.env.NODE_ENV === "production" ? "production" : "development");

export default defineConfig({
  vite: {
    plugins: [dotenvServerPlugin()],
  },
});
