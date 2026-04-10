import { createHash } from 'node:crypto';
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
const outputDir = path.join(repoRoot, 'packages', 'scoring', 'catalog');
const workbookChecksumSha256 = createHash('sha256')
  .update(fs.readFileSync(workbookPath))
  .digest('hex');

const pythonScript = String.raw`
import json
import os
import re
import sys
from datetime import datetime, timezone
from openpyxl import load_workbook

workbook_path = sys.argv[1]
output_dir = sys.argv[2]
workbook_checksum = sys.argv[3]

workbook = load_workbook(workbook_path, data_only=True, read_only=True)
sheet_names = workbook.sheetnames

SECTION_CODES = list("ABCDEFGHIJKLMNOPQRSTU")
PRIORITY_KEYS = {
    "Not applicable": "not_applicable",
    "Very Low": "very_low",
    "Low": "low",
    "Relevant": "relevant",
    "High Priority": "high_priority",
}
SCORE_RANGE_OVERRIDES = {
    "Relevant": "\u22652 \u2013 <2.5",
    "High Priority": "\u22652.5 \u2013 4",
}
MOJIBAKE_MARKERS = ("Ã", "â", "Â", "ð")

def normalize_unicode(value):
    if value is None:
        return None

    text = str(value)
    previous = None
    while text != previous:
        previous = text
        if not any(marker in text for marker in MOJIBAKE_MARKERS):
            break
        try:
            repaired = text.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if repaired == text:
            break
        text = repaired

    return text.replace("\xa0", " ")

def clean_text(value):
    if value is None:
        return None
    text = normalize_unicode(value).strip()
    return text if text else None

def clean_multiline(value):
    text = clean_text(value)
    if not text:
        return None
    return re.sub(r"\r\n?", "\n", text)

def normalize_payload(value):
    if isinstance(value, str):
        return normalize_unicode(value)
    if isinstance(value, list):
        return [normalize_payload(item) for item in value]
    if isinstance(value, dict):
        return {key: normalize_payload(item) for key, item in value.items()}
    return value

def compact_rows(sheet_name, limit=80):
    sheet = workbook[sheet_name]
    rows = []
    for row in sheet.iter_rows(values_only=True):
        values = [normalize_payload(value) for value in row]
        if any(value not in (None, "") for value in values):
            rows.append(values)
        if len(rows) >= limit:
            break
    return rows

def extract_sdgs(values):
    sdgs = []
    for value in values:
        if isinstance(value, (int, float)) and 1 <= int(value) <= 17:
            sdgs.append(int(value))
    seen = []
    for value in sdgs:
        if value not in seen:
            seen.append(value)
    return seen

def build_business_categories():
    sheet = workbook["Activity types (Short)"]
    categories = []
    for row in sheet.iter_rows(values_only=True):
        label = clean_text(row[1] if len(row) > 1 else None)
        if not label or label in {"Category"}:
            continue
        if label.startswith("Business categories"):
            continue
        sdgs = extract_sdgs((row[3:9] if len(row) > 8 else []))
        section_code = SECTION_CODES[len(categories)] if len(categories) < len(SECTION_CODES) else None
        categories.append(
            {
                "sectionCode": section_code,
                "label": label,
                "sdgs": sdgs,
            }
        )
    return categories

def build_extended_nace():
    sheet = workbook["Activity types extended (NACE)"]
    division_rows = {}
    for row in sheet.iter_rows(values_only=True):
        identifier = clean_text(row[13] if len(row) > 13 else None)
        parent_identifier = clean_text(row[14] if len(row) > 14 else None)
        nace_code = clean_text(row[15] if len(row) > 15 else None)
        parent_code = clean_text(row[16] if len(row) > 16 else None)
        name = clean_text(row[17] if len(row) > 17 else None)
        division_label = clean_text(row[1] if len(row) > 1 else None) or name
        if (
            identifier
            and nace_code
            and re.fullmatch(r"\d{2}", nace_code)
            and re.fullmatch(r"\d{2}", identifier)
        ):
            section_code = None
            if parent_code and re.fullmatch(r"[A-Z]", parent_code):
                section_code = parent_code
            elif parent_identifier and re.fullmatch(r"[A-Z]", parent_identifier):
                section_code = parent_identifier
            division_rows[nace_code] = {
                "divisionCode": nace_code,
                "divisionLabel": division_label,
                "sectionCode": section_code,
            }

    section_label_by_code = {
        entry["sectionCode"]: entry["label"]
        for entry in build_business_categories()
        if entry["sectionCode"]
    }

    items = []
    seen_codes = set()
    for row in sheet.iter_rows(values_only=True):
        nace_code = clean_text(row[15] if len(row) > 15 else None)
        name = clean_text(row[17] if len(row) > 17 else None)
        if not nace_code or not name:
            continue
        if not re.fullmatch(r"\d{2}(?:\.\d+)?", nace_code):
            continue
        if nace_code in seen_codes:
            continue
        seen_codes.add(nace_code)
        division_code = nace_code[:2]
        division_entry = division_rows.get(division_code, {})
        section_code = division_entry.get("sectionCode")
        items.append(
            {
                "code": nace_code,
                "label": name,
                "divisionCode": division_code,
                "divisionLabel": division_entry.get("divisionLabel"),
                "sectionCode": section_code,
                "sectionLabel": section_label_by_code.get(section_code),
            }
        )
    return items

def read_title_followed_by_body(sheet_name, title):
    sheet = workbook[sheet_name]
    grid = [[clean_multiline(cell) for cell in row] for row in sheet.iter_rows(values_only=True)]
    for row_index, row in enumerate(grid):
        for column_index, value in enumerate(row):
            if value == title:
                for probe_index in range(row_index + 1, len(grid)):
                    candidate = (
                        grid[probe_index][column_index]
                        if column_index < len(grid[probe_index])
                        else None
                    )
                    if candidate:
                        return candidate
    return None

def build_guidance():
    score_sheet = workbook["Score-Matrix"]
    score_bands = []
    for row in score_sheet.iter_rows(values_only=True):
        score_range = clean_text(row[2] if len(row) > 2 else None)
        title = clean_text(row[3] if len(row) > 3 else None)
        interpretation = clean_multiline(row[4] if len(row) > 4 else None)
        if title in PRIORITY_KEYS and score_range and interpretation:
            score_bands.append(
                {
                    "key": PRIORITY_KEYS[title],
                    "scoreRangeLabel": SCORE_RANGE_OVERRIDES.get(title, score_range),
                    "title": title,
                    "interpretation": interpretation,
                }
            )

    matrix_sheet = workbook["Risks and Opportunities(Matrix)"]
    risk_entries = []
    opportunity_entries = []
    current_mode = None
    for row in matrix_sheet.iter_rows(values_only=True):
        title = clean_text(row[1] if len(row) > 1 else None)
        legend_label = clean_text(row[16] if len(row) > 16 else None)
        what_it_means = clean_multiline(row[17] if len(row) > 17 else None)
        esrs_angle = clean_multiline(row[18] if len(row) > 18 else None)
        business_signal = clean_multiline(row[19] if len(row) > 19 else None)
        action_window = clean_multiline(row[20] if len(row) > 20 else None)
        score = row[5] if len(row) > 5 and isinstance(row[5], (int, float)) else None

        if title == "Risk Matrix":
            current_mode = "risk"
            continue
        if title == "Opportunity Matrix":
            current_mode = "opportunity"
            continue
        if legend_label and what_it_means and score is not None:
            entry = {
                "label": legend_label,
                "score": int(score),
                "whatItMeans": what_it_means,
                "esrsAngle": esrs_angle or "",
                "businessSignal": business_signal or "",
                "actionWindow": action_window or "",
            }
            if current_mode == "risk":
                risk_entries.append(entry)
            elif current_mode == "opportunity":
                opportunity_entries.append(entry)

    explanation_blocks = []
    for title in [
        "About this Initial Summary & SDG Alignment",
        "How to read this?",
        "Example:",
        "Why results may evolve?",
        "Takeaway:",
    ]:
        body = read_title_followed_by_body("Initial Summary", title)
        if body:
            explanation_blocks.append(
                {
                    "title": title,
                    "body": body,
                }
            )

    return {
        "scoreInterpretation": {
            "title": "Workbook score interpretation",
            "subtitle": "Use the workbook bands to read topic materiality and prioritization consistently across the site.",
            "bands": score_bands,
        },
        "riskMatrixLegend": {
            "title": "Workbook risk matrix",
            "subtitle": "Probability \u00d7 impact ratings with ESRS and business interpretation from the workbook.",
            "entries": risk_entries,
        },
        "opportunityMatrixLegend": {
            "title": "Workbook opportunity matrix",
            "subtitle": "Likelihood \u00d7 impact ratings with ESRS and business interpretation from the workbook.",
            "entries": opportunity_entries,
        },
        "initialSummaryExplanationBlocks": explanation_blocks,
    }

snapshot = {
    "workbookPath": workbook_path,
    "workbookSha256": workbook_checksum,
    "generatedAt": datetime.fromtimestamp(os.path.getmtime(workbook_path), tz=timezone.utc).isoformat(),
    "sheetNames": sheet_names,
    "helperSheets": {
        "SSEF (Matrix)+UN SDG": compact_rows("SSEF (Matrix)+UN SDG"),
        "Activity types extended (NACE)": compact_rows("Activity types extended (NACE)"),
        "Risks and Opportunities(Matrix)": compact_rows("Risks and Opportunities(Matrix)"),
        "HSA Criteria  (Default data)": compact_rows("HSA Criteria  (Default data)"),
    },
}

os.makedirs(output_dir, exist_ok=True)

outputs = {
    "workbook-snapshot.json": snapshot,
    "business-categories.json": build_business_categories(),
    "extended-nace.json": build_extended_nace(),
    "workbook-guidance.json": build_guidance(),
}

for filename, payload in outputs.items():
    with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as handle:
        json.dump(normalize_payload(payload), handle, indent=2, ensure_ascii=False)
`;

if (!fs.existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}

const result = spawnSync(
  'python',
  ['-X', 'utf8', '-c', pythonScript, workbookPath, outputDir, workbookChecksumSha256],
  {
    cwd: repoRoot,
    encoding: 'utf8'
  }
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || 'Workbook extraction failed.');
  process.exit(result.status ?? 1);
}

console.info(`Workbook catalogs written to ${outputDir}`);
