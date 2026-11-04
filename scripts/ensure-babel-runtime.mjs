// Cloudflare Builds restores a dependencies cache before it runs npm clean-install,
// and on this project that cache has repeatedly produced a node_modules/@babel/runtime
// directory whose files are not there: the install prints "added 583 packages", npm's
// own state file agrees with itself, `npm install` says "up to date", and the client
// build then dies on the first specifier jspdf needs -
//
//   [vite]: Rollup failed to resolve import "@babel/runtime/helpers/typeof"
//     from node_modules/jspdf/dist/jspdf.es.min.js
//
// The same commit builds green on a fresh clone and on ubuntu GitHub Actions, so this
// is the build environment, not the code. Naming the package and forcing the install is
// the one thing that reliably repairs it; a plain `npm install --force` still short-circuits
// to "up to date" because npm is trusting its recorded tree.
//
// Runs as the first step of build:pages so it costs nothing when the tree is healthy.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// What the bundler actually reaches for. jspdf pulls in helpers/typeof and
// helpers/slicedToArray; canvg, dom-helpers and react-transition-group add the
// helpers/esm/* variants, so both trees are probed rather than guessing one.
const probes = [
  'node_modules/@babel/runtime/helpers/typeof.js',
  'node_modules/@babel/runtime/helpers/esm/typeof.js',
  'node_modules/@babel/runtime/helpers/esm/slicedToArray.js',
];

const missing = () => probes.filter((p) => !existsSync(join(root, p)));

// Take the version from the lockfile so this guard can never install something the
// rest of the tree was not resolved against.
function lockedVersion() {
  try {
    const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
    return lock.packages?.['node_modules/@babel/runtime']?.version ?? null;
  } catch {
    return null;
  }
}

let absent = missing();
if (absent.length === 0) {
  console.log('[ensure-babel-runtime] dependency tree complete, nothing to repair');
  process.exit(0);
}

const version = lockedVersion();
if (!version) {
  console.error('[ensure-babel-runtime] cannot read @babel/runtime from package-lock.json; aborting');
  process.exit(1);
}

console.log(
  `[ensure-babel-runtime] ${absent.length} helper file(s) missing (${absent.join(', ')}); ` +
    `forcing a fresh extract of @babel/runtime@${version}`,
);

const args = [
  'install',
  `@babel/runtime@${version}`,
  '--no-save',
  '--force',
  // A cache directory the restored build cache has never touched, so npm has to
  // fetch the tarball from the registry instead of trusting what it was handed.
  '--cache',
  join(tmpdir(), 'npm-uncached'),
  '--no-audit',
  '--no-fund',
];

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.status !== 0) {
  console.error(`[ensure-babel-runtime] npm install exited ${result.status ?? result.signal}`);
  process.exit(result.status ?? 1);
}

absent = missing();
if (absent.length > 0) {
  console.error(
    `[ensure-babel-runtime] still missing after repair (${absent.join(', ')}) - ` +
      'the build would fail to resolve them, so stopping here with a clear message',
  );
  process.exit(1);
}

console.log('[ensure-babel-runtime] repaired, helpers present');
