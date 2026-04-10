import { cp, mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const overlayDir = path.join(repoRoot, 'deploy', 'huggingface-space');

const repoId = process.argv[2] ?? process.env.HF_SPACE_REPO_ID;
const shouldUpload = !process.argv.includes('--skip-upload');
const githubSha = process.env.GITHUB_SHA?.slice(0, 7);
const commitMessage =
  process.env.HF_SPACE_COMMIT_MESSAGE ??
  (githubSha
    ? `Deploy ZEEUS full-stack Space demo from ${githubSha}`
    : 'Deploy ZEEUS full-stack Space demo');

if (!repoId) {
  console.error('Usage: npm run hf:space:publish -- <username/space-name> [--skip-upload]');
  process.exit(1);
}

const ignoredTopLevel = new Set([
  '.git',
  '.github',
  '.gitignore',
  '.artifacts',
  '.hf-space-build',
  '.turbo',
  'coverage',
  'node_modules',
  'playwright-report',
  'references',
  'test-results'
]);

const ignoredNames = new Set(['node_modules', '.next', 'dist']);
const spaceReferenceFiles = [
  '1) Introduction_ZEEUS.pdf',
  '2) Usermanual_ZEEUS.pdf',
  '3) FAQ_ZEEUS.pdf',
  '4) Score Interpretation_ZEEUS.pdf',
  '5) Tool & Example.zip',
  '6) GUIDELINES KIT- ZEEUS.pdf',
  'Tool_Introduction_Video.txt'
];

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

const stageDir = await mkdtemp(path.join(os.tmpdir(), 'zeeus-hf-space-'));

const topLevelEntries = await readdir(repoRoot, { withFileTypes: true });
for (const entry of topLevelEntries) {
  if (ignoredTopLevel.has(entry.name)) {
    continue;
  }

  if (entry.isFile() && /^tmp-.*\.log$/i.test(entry.name)) {
    continue;
  }

  const sourcePath = path.join(repoRoot, entry.name);
  const targetPath = path.join(stageDir, entry.name);

  await cp(sourcePath, targetPath, {
    recursive: true,
    filter: (source) => shouldCopy(path.relative(repoRoot, source))
  });
}

const stageReferenceDir = path.join(stageDir, 'references', 'Hackathon_User Guidlines');
await mkdir(stageReferenceDir, { recursive: true });

for (const fileName of spaceReferenceFiles) {
  await cp(
    path.join(repoRoot, 'references', 'Hackathon_User Guidlines', fileName),
    path.join(stageReferenceDir, fileName)
  );
}

await writeFile(
  path.join(stageDir, '.gitignore'),
  [
    'node_modules',
    '**/node_modules',
    'dist',
    '**/dist',
    '**/.next',
    '*.tsbuildinfo',
    '**/*.tsbuildinfo',
    '.env',
    '.env.*',
    '.artifacts',
    'coverage',
    'playwright-report',
    'test-results'
  ].join('\n') + '\n',
  'utf8'
);

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
  '--space-sdk',
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
  commitMessage
]);

console.log(`Published https://huggingface.co/spaces/${repoId}`);
