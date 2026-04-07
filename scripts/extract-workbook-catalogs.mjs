import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const workbookPath =
  process.argv[2] ??
  path.join(
    repoRoot,
    'references',
    'Hackathon_User Guidlines',
    '5) Tool & Example',
    '5) Tool & Example',
    '5) Startup Evaluation Tool Final_V10_+Matrix 2025-03-20.xlsm'
  );
const outputPath = path.join(repoRoot, 'packages', 'scoring', 'catalog', 'workbook-snapshot.json');

const pythonScript = String.raw`
import json
import sys
from openpyxl import load_workbook

workbook_path = sys.argv[1]
output_path = sys.argv[2]

workbook = load_workbook(workbook_path, data_only=True, read_only=True)
sheet_names = workbook.sheetnames

def sheet_rows(sheet_name, limit=80):
    sheet = workbook[sheet_name]
    rows = []
    for row in sheet.iter_rows(values_only=True):
        values = [value for value in row]
        if any(value not in (None, '') for value in values):
            rows.append(values)
        if len(rows) >= limit:
            break
    return rows

snapshot = {
    "workbookPath": workbook_path,
    "sheetNames": sheet_names,
    "helperSheets": {
        "SSEF (Matrix)+UN SDG": sheet_rows("SSEF (Matrix)+UN SDG"),
        "Activity types extended (NACE)": sheet_rows("Activity types extended (NACE)"),
        "Risks and Opportunities(Matrix)": sheet_rows("Risks and Opportunities(Matrix)"),
        "HSA Criteria  (Default data)": sheet_rows("HSA Criteria  (Default data)")
    }
}

with open(output_path, 'w', encoding='utf-8') as file_handle:
    json.dump(snapshot, file_handle, indent=2, ensure_ascii=False)
`;

if (!fs.existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}

const result = spawnSync('python', ['-c', pythonScript, workbookPath, outputPath], {
  cwd: repoRoot,
  encoding: 'utf8'
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || 'Workbook extraction failed.');
  process.exit(result.status ?? 1);
}

console.info(`Workbook snapshot written to ${outputPath}`);
