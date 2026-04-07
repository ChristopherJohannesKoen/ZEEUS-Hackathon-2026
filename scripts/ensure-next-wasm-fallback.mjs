import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');
const sourceDirectory = path.join(repoRoot, 'node_modules', '@next', 'swc-wasm-nodejs');
const targetDirectory = path.join(repoRoot, 'node_modules', 'next', 'wasm', '@next', 'swc-wasm-nodejs');
const filesToCopy = ['package.json', 'README.md', 'wasm.d.ts', 'wasm.js', 'wasm_bg.wasm'];

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (await fileExists(sourceDirectory)) {
  await mkdir(targetDirectory, { recursive: true });

  for (const fileName of filesToCopy) {
    const sourcePath = path.join(sourceDirectory, fileName);
    const targetPath = path.join(targetDirectory, fileName);

    if (await fileExists(sourcePath)) {
      await copyFile(sourcePath, targetPath);
    }
  }

  console.log('Prepared Next.js wasm fallback package.');
} else {
  console.warn('Skipped Next.js wasm fallback preparation because @next/swc-wasm-nodejs is missing.');
}
