import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const [packagePath, ...copyDirs] = process.argv.slice(2);

if (!packagePath) {
  throw new Error('Usage: node scripts/finalize-package-build.mjs <package-path> [copy-dir...]');
}

const packageRoot = path.resolve(repoRoot, packagePath);
const distRoot = path.join(packageRoot, 'dist');
const esmRoot = path.join(distRoot, 'esm');
const cjsRoot = path.join(distRoot, 'cjs');

await mkdir(esmRoot, { recursive: true });
await mkdir(cjsRoot, { recursive: true });

await writeFile(
  path.join(esmRoot, 'package.json'),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
  'utf8'
);

await writeFile(
  path.join(cjsRoot, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
  'utf8'
);

for (const relativeDir of copyDirs) {
  const sourceDir = path.join(packageRoot, relativeDir);
  await cp(sourceDir, path.join(esmRoot, relativeDir), { recursive: true });
  await cp(sourceDir, path.join(cjsRoot, relativeDir), { recursive: true });
}
