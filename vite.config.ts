// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// jspdf, canvg and dom-helpers ask Babel for its helpers as bare, extension-less
// specifiers ("@babel/runtime/helpers/typeof"). That name only exists inside
// @babel/runtime's `exports` map — the package publishes no main, module or browser
// field, so the map is the only door and there is nothing to fall back on if a build
// environment reads a package.json whose map lacks the key. Cloudflare's does, and the
// client bundle dies there at 384 modules with
//   [commonjs--resolver] Missing "./helpers/typeof" specifier in "@babel/runtime" package
// (reproduced locally by deleting exactly those two keys and nothing else).
//
// The helpers themselves are plain, dependency-free ESM files, so the specifier is
// pinned to the file on disk by absolute path. Vite resolves an absolute alias
// replacement without consulting `exports` at all, which is the point: the same module
// the map would have selected, reached by a route that cannot miss. Only extension-less,
// non-esm specifiers match, so callers that already ask for helpers/esm/* are left
// exactly as they are.
const esmHelpersDir = path.resolve("node_modules/@babel/runtime/helpers/esm") + path.sep;
const runtimeRoot = path.resolve("node_modules/@babel/runtime") + path.sep;

export default defineConfig({
  vite: {
    resolve: {
      alias: [
        {
          find: /^@babel\/runtime\/helpers\/(?!esm\/)([^/]+)$/,
          replacement: `${esmHelpersDir}$1.js`,
        },
        // The one @babel/runtime specifier in this dependency graph that is not a helper:
        // canvg's regenerator, which the map sends to a single file with no conditions.
        {
          find: /^@babel\/runtime\/regenerator$/,
          replacement: `${runtimeRoot}regenerator${path.sep}index.js`,
        },
      ],
    },
  },
});
