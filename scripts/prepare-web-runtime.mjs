import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const args = new Set(process.argv.slice(2));
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');
const webDirectory = path.join(repoRoot, 'apps', 'web');
const shouldCleanNext = args.has('--clean-next');
const shouldSkipRuntimeBuild = args.has('--skip-runtime-build');

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${code ?? 1}.`));
    });

    child.on('error', reject);
  });
}

await run('node', [path.join('scripts', 'ensure-next-wasm-fallback.mjs')]);

if (!shouldSkipRuntimeBuild) {
  await run('npm', ['run', 'build:runtime-packages']);
}

if (shouldCleanNext) {
  await rm(path.join(webDirectory, '.next'), {
    force: true,
    recursive: true
  });
  console.log('Cleaned apps/web/.next before starting Next.js.');
}
