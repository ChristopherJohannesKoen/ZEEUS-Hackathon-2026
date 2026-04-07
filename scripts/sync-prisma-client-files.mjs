import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const generatedClientDir = path.join(repoRoot, 'node_modules', '.prisma', 'client');
const packageClientDir = path.join(repoRoot, 'node_modules', '@prisma', 'client');

if (!fs.existsSync(generatedClientDir) || !fs.existsSync(packageClientDir)) {
  process.exit(0);
}

for (const entry of fs.readdirSync(generatedClientDir)) {
  if (!entry.endsWith('.d.ts')) {
    continue;
  }

  fs.copyFileSync(path.join(generatedClientDir, entry), path.join(packageClientDir, entry));
}
