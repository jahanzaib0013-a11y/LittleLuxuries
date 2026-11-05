// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { existsSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Cloudflare's build container cannot finish a package lookup that begins inside
// node_modules. The tree there is provably healthy - the build log shows the right
// @babel/runtime installed with an intact exports map, no symlinks in the path, and
// Node's own require.resolve() finding the file - yet Rollup dies on the bare specifier
// one dependency asks of another, moving forward exactly one package per attempt:
//   Rollup failed to resolve import "@babel/runtime/helpers/typeof" from jspdf.es.min.js
//   Rollup failed to resolve import "fflate"                      from jspdf.es.min.js
// Pinning the first of those to an absolute path made the build advance to the second,
// so absolute lookups work there while walk-up-from-the-importer lookups do not.
//
// This plugin finishes the job for every dependency-to-dependency import, and it is
// written to be inert wherever resolution already works:
//   - it asks vite the same question first and stays out of the way unless vite has no
//     answer (including where vite's resolver throws, which is how a missing exports key
//     shows up);
//   - it only speaks for importers inside node_modules, so application code, its aliases
//     and anything a framework plugin virtualises are untouched.
// The retry is a package root reached by absolute path, and vite still picks the entry
// point, browser field and export conditions for it. It runs for both bundles, because a
// build environment that cannot walk up from one importer is unlikely to spare the other.
// Verified inert by comparing every content-hashed chunk name and file size, client and
// server, on a healthy machine.
const nodeModulesDir = path.resolve("node_modules") + path.sep;
const nodeModulesUrl = nodeModulesDir.replaceAll("\\", "/");

// "@vue/shared/dist/x.js" -> "@vue/shared", "jspdf" -> "jspdf"; null for anything that is
// not a package lookup (absolute, relative, protocol, import-map).
function packageName(source: string): string | null {
  const clean = source.split("?")[0].split("#")[0];
  if (clean.startsWith("/") || clean.startsWith("#")) return null;
  const segments = clean.split("/");
  return /^[.@]/.test(clean) ? segments.slice(0, 2).join("/") : segments[0];
}

function resolveFallback(): Plugin {
  return {
    name: "littleluxuries:resolve-fallback",
    enforce: "pre",
    apply: "build",
    async resolveId(source, importer, options) {
      if (!importer) return null;
      if (!importer.replaceAll("\\", "/").includes(nodeModulesUrl)) return null;

      const packageRoot = packageName(source);
      if (!packageRoot) return null;
      const absolute = path.join(nodeModulesDir, ...packageRoot.split("/"));
      if (!existsSync(absolute)) return null;

      // Ask vite first, exactly as if this plugin were not here. Anything it finds -
      // including its own virtual modules - is what ships.
      try {
        if ((await this.resolve(source, importer, { ...options, skipSelf: true })) !== null) return null;
      } catch {
        // A thrown lookup is one that produced no answer either.
      }

      // Vite could not resolve it, so retry from the absolute package directory (plus any
      // subpath). Printing the pair is deliberate: on Cloudflare this names every
      // specifier that needed rescuing, and anywhere else it prints nothing at all.
      const target = absolute + source.slice(packageRoot.length).replaceAll("/", path.sep);
      console.log(`[resolve-fallback] ${source} from ${path.relative(nodeModulesDir, importer)} -> ${target}`);
      return this.resolve(target, importer, { ...options, skipSelf: true });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [resolveFallback()],
  },
});
