import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const stageDir = path.join(repoRoot, '.hf-space-build');
const overlayDir = path.join(repoRoot, 'deploy', 'huggingface-space');

const repoId = process.argv[2] ?? process.env.HF_SPACE_REPO_ID;
const shouldUpload = !process.argv.includes('--skip-upload');

if (!repoId) {
  console.error('Usage: npm run hf:space:publish -- <username/space-name> [--skip-upload]');
  process.exit(1);
}

const ignoredTopLevel = new Set([
  '.git',
  '.github',
  '.hf-space-build',
  '.turbo',
  'coverage',
  'node_modules',
  'playwright-report',
  'references',
  'test-results'
]);

const ignoredNames = new Set(['node_modules', '.next', 'dist']);

function shouldCopy(relativePath) {
  if (!relativePath || relativePath === '.') {
    return true;
  }

  if (
    relativePath === '.env' ||
    relativePath === '.env.local' ||
    relativePath.startsWith('.env.')
  ) {
    return false;
  }

  return !relativePath.split(path.sep).some((segment) => ignoredNames.has(segment));
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await rm(stageDir, { recursive: true, force: true });
await mkdir(stageDir, { recursive: true });

const topLevelEntries = await readdir(repoRoot, { withFileTypes: true });
for (const entry of topLevelEntries) {
  if (ignoredTopLevel.has(entry.name)) {
    continue;
  }

  const sourcePath = path.join(repoRoot, entry.name);
  const targetPath = path.join(stageDir, entry.name);

  await cp(sourcePath, targetPath, {
    recursive: true,
    filter: (source) => shouldCopy(path.relative(repoRoot, source))
  });
}

await cp(path.join(overlayDir, 'README.md'), path.join(stageDir, 'README.md'));
await cp(path.join(overlayDir, 'Dockerfile'), path.join(stageDir, 'Dockerfile'));
await cp(path.join(overlayDir, '.dockerignore'), path.join(stageDir, '.dockerignore'));
await cp(
  path.join(overlayDir, 'space-entrypoint.sh'),
  path.join(stageDir, 'deploy', 'huggingface-space', 'space-entrypoint.sh')
);

console.log(`Prepared Hugging Face Space bundle in ${stageDir}`);

if (!shouldUpload) {
  process.exit(0);
}

run('hf', [
  'repo',
  'create',
  repoId,
  '--repo-type',
  'space',
  '--space_sdk',
  'docker',
  '--exist-ok'
]);
run('hf', [
  'upload',
  repoId,
  stageDir,
  '.',
  '--repo-type',
  'space',
  '--commit-message',
  'Deploy ZEEUS full-stack Space demo'
]);

console.log(`Published https://huggingface.co/spaces/${repoId}`);
