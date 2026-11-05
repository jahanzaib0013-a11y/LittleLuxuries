// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Cloudflare's build container runs out of file descriptors, and the failure wears the
// costume of a broken dependency tree. Under the resolve error, its log shows:
//   [commonjs--resolver] EMFILE: too many open files,
//   open '/opt/buildhome/repo/node_modules/fflate/package.json'
//     at loadPackageData (vite/dist/node/chunks/config.js:1700:41)
//     at tryCleanFsResolve (...:32759:42)
//     at tryFsResolve (...:32724:14)
// A package.json that cannot be opened is not a package that does not exist, but vite's
// resolver answers "no match" anyway, so for four deploys the build reported
//   Rollup failed to resolve import "@babel/runtime/helpers/typeof" from jspdf.es.min.js
//   Rollup failed to resolve import "fflate"                       from jspdf.es.min.js
// while the lockfile, the installed tree and every exports map were provably healthy -
// the previous commit's diagnostic proved that, and this plugin is what exposed the
// EMFILE, by repeating the lookup vite had silently given up on.
//
// The remedy is in build:pages, which raises the descriptor limit before vite starts.
// This plugin stays as the safety net for any dependency-to-dependency lookup vite
// cannot answer, and it reports the environment's limits so the next build log shows the
// numbers rather than leaving them inferred. It is written to be inert wherever
// resolution works: it asks vite first and only repeats the question when vite has no
// answer, it speaks only for importers inside node_modules, and on a healthy machine the
// client and server output is identical in names, sizes and counts while nothing here
// prints at all.
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

// What the container actually granted the build process. /proc is Linux-only, which is
// exactly the platform this is meant to explain; anywhere else this says nothing.
// Both the per-process limit and the kernel-wide pool are reported, because EMFILE has
// two different causes and the next build log should say which one it was.
function reportFileLimits() {
  if (process.platform !== "linux") return;
  try {
    const limits = readFileSync("/proc/self/limits", "utf8")
      .split("\n")
      .find((line) => line.toLowerCase().startsWith("max open files"));
    const open = readdirSync("/proc/self/fd").length;
    const [allocated, maximum] = readFileSync("/proc/sys/fs/file-nr", "utf8").trim().split(/\s+/);
    console.log(
      `[resolve-fallback] file limits: ${limits?.trim() ?? "unknown"} | descriptors in use: ${open}` +
        ` | system-wide: ${allocated}/${maximum}`,
    );
  } catch {
    // Diagnostic only; never fail a build over it.
  }
}

function resolveFallback(): Plugin {
  return {
    name: "littleluxuries:resolve-fallback",
    enforce: "pre",
    apply: "build",
    buildStart() {
      reportFileLimits();
    },
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
        // A thrown lookup is one that produced no answer either. This is where an EMFILE
        // surfaces as itself instead of as a missing dependency.
      }

      // Vite could not resolve it, so retry from the absolute package directory (plus any
      // subpath), letting vite still choose the entry point, browser field and export
      // conditions. Printing the pair is deliberate: on a machine that needs no help this
      // prints nothing, and on one that does it names every specifier involved.
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
