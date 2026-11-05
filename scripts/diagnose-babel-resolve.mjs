// Cloudflare's build is the one environment where the client bundle cannot resolve
// @babel/runtime/helpers/typeof, and it is not because the file is missing:
// ensure-babel-runtime.mjs has already proven the helpers exist on disk there. So the
// answer is in how that environment resolves it, and nothing but the environment itself
// can tell us. This prints the facts we need, with a [diag] prefix so they are easy to
// find in the build log, and never fails the build - vite is going to fail right after
// it anyway, and the point of this run is the log.
//
// Temporary by design: it exists to explain one build. Delete it, and its call in
// build:pages, as soon as the Workers build is green again.
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (label, value) => console.log(`[diag] ${label}: ${value}`);

const pkgDir = join(root, 'node_modules/@babel/runtime');
const spec = '@babel/runtime/helpers/typeof';

// 1. Which version is actually sitting there, and what does it publish?
try {
  const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  log('installed version', pkg.version);
  log('has exports field', pkg.exports !== undefined);
  const keys = Object.keys(pkg.exports ?? {}).filter((k) => k.includes('typeof') || k.includes('slicedToArray'));
  log('exports keys for the failing helpers', JSON.stringify(keys));
  log('exports["./helpers/typeof"]', JSON.stringify(pkg.exports?.['./helpers/typeof']));
  log('main/module/browser', `${pkg.main} / ${pkg.module} / ${pkg.browser}`);
  log('helper file count', readdirSync(join(pkgDir, 'helpers')).length);
  log('esm helper file count', readdirSync(join(pkgDir, 'helpers/esm')).length);
} catch (error) {
  log('package.json read', 'FAILED ' + error.message);
}

// 2. Is the tree where we think it is? A symlinked node_modules (cache mounts) changes
//    what an importer-relative lookup walks up to, which is exactly this class of bug.
for (const p of ['node_modules', 'node_modules/@babel', 'node_modules/@babel/runtime', 'node_modules/jspdf']) {
  const abs = join(root, p);
  let real = '(unreadable)';
  try {
    real = realpathSync(abs);
  } catch (error) {
    real = 'ERROR ' + error.code;
  }
  log(`realpath ${p}`, `${real}${real === abs ? '   [not symlinked]' : '   [DIFFERS FROM ' + abs + ']'}`);
}

// 3. Two resolvers, two condition sets. If Node itself cannot resolve the specifier, the
//    exports map is the problem. If Node can and vite cannot, the difference is in the
//    conditions vite asks for (module/browser/production).
const req = createRequire(join(root, 'node_modules/jspdf/dist/'));
try {
  log('require.resolve (CJS conditions)', req.resolve(spec));
} catch (error) {
  log('require.resolve (CJS conditions)', 'FAILED ' + error.code + ' ' + error.message.split('\n')[0]);
}
try {
  log('import.meta.resolve (ESM conditions)', import.meta.resolve(spec, 'file://' + join(root, 'node_modules/jspdf/dist/jspdf.es.min.js')));
} catch (error) {
  log('import.meta.resolve (ESM conditions)', 'FAILED ' + (error.code ?? '') + ' ' + error.message.split('\n')[0]);
}

// 4. The plain file path, extension included, which is what a resolver needs to fall back to.
log('helpers/typeof.js exists', existsSync(join(pkgDir, 'helpers/typeof.js')));
log('helpers/esm/typeof.js exists', existsSync(join(pkgDir, 'helpers/esm/typeof.js')));

// 5. Anything the build environment injects that changes resolution or install behaviour.
const interesting = Object.entries(process.env)
  .filter(([k]) => /^(npm_config_|NODE_|YARN|CI=|VITE_)/.test(k))
  .filter(([k]) => !/TOKEN|SECRET|KEY|PASSWORD/i.test(k))
  .sort(([a], [b]) => a.localeCompare(b));
for (const [k, v] of interesting) log(`env ${k}`, v);
log('node', process.version);
log('platform', `${process.platform} ${process.arch}`);
try {
  const vite = JSON.parse(readFileSync(join(root, 'node_modules/vite/package.json'), 'utf8'));
  log('vite version', vite.version);
} catch (error) {
  log('vite version', 'FAILED ' + error.message);
}
