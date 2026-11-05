// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { existsSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Cloudflare's build container gives the build process 1024 file descriptors and that is the
// hard limit too - its log reads "Max open files 1024 1024 files" - so no `ulimit` inside the
// build command can raise it. The build exhausts the descriptors around module 385, and the
// failure wears the costume of a broken dependency tree:
//   [commonjs--resolver] EMFILE: too many open files,
//   open '/opt/buildhome/repo/node_modules/fflate/package.json'
//     at loadPackageData (vite/dist/node/chunks/config.js:1700:41)
//     at tryCleanFsResolve (...:32759:42)
//     at tryFsResolve (...:32724:14)
// A package.json that cannot be opened is not a package that does not exist, but vite's
// resolver answers "no match" anyway, which is why successive deploys each named a different
// healthy dependency while the lockfile, the installed tree and every exports map were
// provably intact.
//
// Two levers are left, and both are here. The first lowers the pressure: maxParallelFileOps is
// how many files rollup keeps open at once, and its default of 20 assumes more headroom than
// this container has. The second is the plugin below, the safety net for any
// dependency-to-dependency lookup vite cannot answer, which now also reports what is holding
// the descriptors - at build start, as the module count climbs, and at the instant a lookup
// throws EMFILE. Twenty-nine were in use when the build started and it died at 385 modules, so
// something accumulates during the build, and that is the last unknown number.
//
// The plugin stays inert wherever resolution works: it asks vite first and only repeats the
// question when vite has no answer, it speaks only for importers inside node_modules, and on a
// healthy machine the client and server output is identical in names, sizes and counts while
// nothing here prints at all.
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

// What the process holds right now: how many descriptors, and of what kind. /proc is
// Linux-only, which is exactly the platform this is meant to explain; anywhere else this
// says nothing.
function fdReport(): string {
  if (process.platform !== "linux") return "";
  try {
    const fds = readdirSync("/proc/self/fd");
    const kinds = new Map<string, number>();
    for (const fd of fds) {
      let target: string;
      try {
        target = readlinkSync(path.join("/proc/self/fd", fd));
      } catch {
        continue;
      }
      const kind = target.startsWith("pipe:")
        ? "pipe"
        : target.startsWith("socket:")
          ? "socket"
          : target.endsWith("package.json")
            ? "package.json"
            : /\.(js|mjs|cjs|ts)$/.test(target)
              ? "source"
              : "other";
      kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    }
    const parts = [...kinds]
      .sort((a, b) => b[1] - a[1])
      .map(([kind, count]) => `${kind}=${count}`)
      .join(" ");
    return `descriptors ${fds.length} (${parts})`;
  } catch {
    return "descriptors unknown";
  }
}

// The limit, what this process holds at this instant, and what the kernel as a whole holds:
// EMFILE has two possible causes, so the build log should say which one it was rather than
// leave it inferred. The three fields of /proc/sys/fs/file-nr are allocated, free, maximum.
function reportFileLimits(stage: string) {
  if (process.platform !== "linux") return;
  try {
    const limits = readFileSync("/proc/self/limits", "utf8")
      .split("\n")
      .find((line) => line.toLowerCase().startsWith("max open files"));
    const [allocated, , maximum] = readFileSync("/proc/sys/fs/file-nr", "utf8").trim().split(/\s+/);
    const both = limits ? limits.trim().split(/\s+/).slice(1, 3).join("/") : "unknown";
    console.log(`[resolve-fallback] ${stage} | limit soft/hard ${both} | ${fdReport()} | system ${allocated}/${maximum}`);
  } catch {
    // Diagnostic only; never fail a build over it.
  }
}

function resolveFallback(): Plugin {
  let parsed = 0;
  return {
    name: "littleluxuries:resolve-fallback",
    enforce: "pre",
    apply: "build",
    buildStart() {
      reportFileLimits("build start");
    },
    moduleParsed() {
      // The growth curve, so the log shows whether descriptors climb with the module count.
      if (++parsed % 400 === 0) reportFileLimits(`${parsed} modules parsed`);
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
      } catch (error) {
        // A thrown lookup is one that produced no answer either. If it threw because the
        // process is out of descriptors, name it, with the numbers, at that moment.
        const code = (error as { code?: string })?.code;
        if (code === "EMFILE" || code === "ENFILE") reportFileLimits(`${code} looking up ${source}`);
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
    build: {
      rollupOptions: {
        // Rollup's own concurrency for opening files, 20 by default. The container allows the
        // whole process 1024 descriptors and the build dies at module 385, so rollup is asked
        // to keep fewer handles in flight at once. This only schedules reads; it cannot change
        // what ends up in the output.
        maxParallelFileOps: 4,
      },
    },
  },
});
