import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const referenceDir = path.join(repoRoot, 'references', 'Hackathon_User Guidlines');
const catalogDir = path.join(repoRoot, 'packages', 'scoring', 'catalog');

const requiredReferenceFiles = [
  '1) Introduction_ZEEUS.pdf',
  '2) Usermanual_ZEEUS.pdf',
  '3) FAQ_ZEEUS.pdf',
  '4) Score Interpretation_ZEEUS.pdf',
  '5) Tool & Example.zip',
  '6) GUIDELINES KIT- ZEEUS.pdf',
  'Tool_Introduction_Video.txt'
];

const requiredCatalogFiles = [
  'business-categories.json',
  'extended-nace.json',
  'workbook-guidance.json',
  'workbook-snapshot.json'
];

const mojibakePatterns = ['â€“', 'â€”', 'â‰¥', 'â‰¤', 'Ã—', 'â€™', 'â€œ', 'â€', 'Â©', 'ðŸ'];

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function assertJsonHasNoMojibake(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matched = mojibakePatterns.find((pattern) => content.includes(pattern));

  if (matched) {
    throw new Error(`Detected mojibake pattern "${matched}" in ${filePath}`);
  }
}

for (const fileName of requiredReferenceFiles) {
  assertFileExists(path.join(referenceDir, fileName));
}

for (const fileName of requiredCatalogFiles) {
  const filePath = path.join(catalogDir, fileName);
  assertFileExists(filePath);
  assertJsonHasNoMojibake(filePath);
}

const workbookSnapshot = JSON.parse(
  fs.readFileSync(path.join(catalogDir, 'workbook-snapshot.json'), 'utf8')
);

if (!workbookSnapshot.workbookSha256 || typeof workbookSnapshot.workbookSha256 !== 'string') {
  throw new Error('workbook-snapshot.json is missing workbookSha256.');
}

if (!Array.isArray(workbookSnapshot.sheetNames) || workbookSnapshot.sheetNames.length === 0) {
  throw new Error('workbook-snapshot.json is missing sheetNames.');
}

console.info('Reference pack validation passed.');
