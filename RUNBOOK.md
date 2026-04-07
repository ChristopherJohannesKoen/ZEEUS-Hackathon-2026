# ZEEUS SbyD Tool — Frontend Runbook

## Quick start

```bash
cd zeeus-sbyd
npm install
npm run dev
# → open http://localhost:3000
```

## Project structure

```
src/
├── app/                         # Next.js 14+ App Router
│   ├── layout.tsx               # Root layout (Inter font, globals)
│   ├── globals.css              # Tailwind v4 @theme + global styles
│   ├── page.tsx                 # Public landing page (/)
│   ├── login/page.tsx           # Login (mocked — any credentials work)
│   ├── signup/page.tsx          # Signup (mocked)
│   ├── app/                     # Protected app shell
│   │   ├── layout.tsx           # AppShell wrapper
│   │   ├── page.tsx             # /app — workspace overview
│   │   ├── evaluations/         # /app/evaluations — list view
│   │   └── evaluate/
│   │       ├── start/           # /app/evaluate/start — new eval form
│   │       └── [id]/            # Dynamic eval routes
│   │           ├── layout.tsx   # Step nav
│   │           ├── summary/     # Step 1 — startup context + SDG prescreen
│   │           ├── stage-1/     # Step 2 — Financial + E/S/G wizard
│   │           ├── stage-2/     # Step 3 — Risks & Opportunities
│   │           ├── impact-summary/ # Step 4 — material topics
│   │           ├── sdg-alignment/  # Step 5 — SDG cards + drawer
│   │           └── dashboard/   # Step 6 — results + radar chart
│   └── report/[id]/page.tsx     # Print-optimised full report
│
├── components/
│   ├── ui/                      # Primitives
│   │   ├── Badge.tsx            # PriorityChip, RiskChip, OpportunityChip, StatusChip, ConfidenceChip
│   │   ├── Button.tsx           # Button variants
│   │   ├── Card.tsx             # Card, CardHeader, ScoreCard
│   │   ├── ProgressBar.tsx      # ProgressBar, ScoreBar
│   │   ├── Select.tsx           # Select, Input, SegmentedControl
│   │   └── Stepper.tsx          # Stepper, PillStepper
│   ├── layout/
│   │   ├── AppShell.tsx         # Sidebar + top nav
│   │   └── ZeeusLogo.tsx        # SVG logo mark + wordmark
│   └── features/evaluation/
│       └── EvalNav.tsx          # Step progress nav in eval flow
│
├── data/
│   ├── esg-topics.ts            # E1–E5, S1–S4, G1 definitions + financial KPIs
│   ├── nace.ts                  # All NACE divisions + NACE→SDG map
│   ├── risks-opportunities.ts   # 10 risks + 10 opportunities + matrices
│   ├── sdgs.ts                  # All 17 SDGs with targets + stage→SDG map
│   └── seed.ts                  # 3 seeded demo evaluations + MOCK_USER
│
├── lib/
│   ├── scoring.ts               # All scoring helpers (deterministic, pure functions)
│   └── utils.ts                 # cn(), formatDate(), generateId()
│
├── store/
│   └── evaluationStore.ts       # Zustand store (persisted to localStorage)
│
└── types/
    └── evaluation.ts            # All TypeScript types and interfaces
```

## Scoring formula

```
E/S/G Impact Score = ((Magnitude + Scale + Irreversibility) / 3) × Likelihood

Priority bands:
  0         → Not Applicable
  >0 – <1   → Very Low
  ≥1 – <2   → Low
  ≥2 – <2.5 → Relevant
  ≥2.5 – 4  → High Priority
```

## Seeded data

Three demo evaluations load automatically from `src/data/seed.ts`:

- `eval-001` — AquaPure Tech (completed, all stages filled)
- `eval-002` — SolarCircle Platform (in progress)
- `eval-003` — FoodLoop Connect (draft)

The mock user is `Alex Müller / alex@greenventure.io`.

## Auth

No real auth is implemented. The login/signup pages are UI-only.
Any form submission goes straight to `/app`.

## Wiring to backend later

Each of these is a clean seam:

| Frontend mock                        | Backend replacement              |
| ------------------------------------ | -------------------------------- |
| `useEvaluationStore()` store actions | NestJS REST endpoints            |
| `SEED_EVALUATIONS` in `seed.ts`      | PostgreSQL query via API         |
| `generateId()`                       | UUID from DB insert              |
| `computeDashboardSummary()`          | Move to shared package / backend |
| `persist(zustand)`                   | Remove persist, use server state |

## CSV export

Click "Export CSV" on the Dashboard or Report page.
The CSV is generated in-browser from the current evaluation state.

## PDF export

On the `/app/report/[id]` route, click "Export PDF" to trigger `window.print()`.
Use Chrome's print-to-PDF for best results. Print styles are in `globals.css`.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (persisted to localStorage)
- Recharts (radar chart on dashboard)
- Lucide React (icons)
- Radix UI primitives (dialogs, selects, etc.)
