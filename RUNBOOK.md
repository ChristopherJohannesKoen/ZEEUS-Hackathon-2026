# ZEEUS Assessment Runbook

## Purpose

This repository ships the ZEEUS hackathon assessment app as a monorepo with:

- `apps/web`: Next.js assessment UI
- `apps/api`: NestJS API
- `apps/worker`: BullMQ worker for queued artifacts and narratives
- `packages/scoring`: deterministic scoring engine
- `packages/db`: Prisma schema, migrations, and seed data
- `PostgreSQL`: persistence for users, evaluations, answers, SDG mappings, and recommendations
- `Redis`: queue backing service
- `MinIO`: local S3-compatible artifact storage

The primary product flow is:

1. Landing page
2. Login or signup
3. Saved evaluations workspace
4. Startup context and SDG pre-screen
5. Stage I assessment
6. Stage II risks and opportunities
7. Impact summary
8. SDG alignment
9. Dashboard
10. Review before completion
11. Report, revisions, compare, persisted export artifacts, narratives, and benchmarks

## First Boot

```powershell
Copy-Item .env.example .env
npm install
npm run dev:services
npm run db:setup
npm run dev
```

Open:

- Web: `http://localhost:3000`
- API docs: `http://localhost:4000/api/docs`
- API health: `http://localhost:4000/api/health`

Seeded local owner:

- Email: `owner@example.com`
- Password: `ChangeMe123!`

## Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Services:

- `db` on `5432`
- `api` on `4000`
- `web` on `3000`
- `redis` for queued jobs
- `minio` for artifact storage and download persistence
- `worker` for PDF rendering, CSV generation, and AI narratives

The API container runs migrations and seed data before starting the Nest server.
The worker consumes queued export and narrative jobs after the stack is healthy.

## Source Of Truth For Scoring

- Workbook helper sheets and matrices are the logic source of truth.
- `scripts/extract-workbook-catalogs.mjs` refreshes committed catalog data under `packages/scoring/catalog`.
- `packages/scoring` contains the pure TypeScript scoring functions used by the API and web UI.
- Confidence and sensitivity hints are explanatory only and do not change saved scores.
- Completed evaluations are read from immutable revision snapshots. Reopening creates a new draft revision instead of mutating the completed result.
- Benchmarks and AI narratives also read from immutable revision snapshots; they never modify canonical scores.

## Common Commands

- `npm run dev`: run web and API together
- `npm run dev:services`: start Postgres, Redis, MinIO, and bucket initialization
- `npm run db:setup`: migrate and seed local DB
- `npm run db:reset`: rebuild local DB from scratch
- `npm run prisma:generate`: regenerate Prisma client
- `npm run typecheck`: TypeScript validation
- `npm test`: workspace test suites
- `npm run build`: production builds
- `node scripts/extract-workbook-catalogs.mjs`: refresh workbook-derived catalogs

## Verification Checklist

Run this before a demo or handoff:

```powershell
npm run typecheck
npm test
npm run build
docker compose up --build -d
docker compose ps
```

Then verify:

- `http://localhost:3000`
- `http://localhost:4000/api/health`
- `http://localhost:4000/api/docs`
- create an evaluation, complete it through the review step, generate CSV and PDF artifacts, and confirm they remain downloadable from revision history after restarting `api` and `worker`
- request at least one AI narrative and confirm it transitions to `ready`
- open the benchmarks view and confirm it renders seeded baseline comparisons

## Troubleshooting

- If Prisma types are missing, run `npm run prisma:generate`.
- If the seeded owner is missing, run `npm run db:setup`.
- If the workbook catalogs need updating, rerun `node scripts/extract-workbook-catalogs.mjs`.
- If `next build` on Windows warns about an invalid native SWC binary, the repo already falls back to `@next/swc-wasm-nodejs` during the web build.
- If the API cannot connect to Postgres in Docker, confirm `.env` exists and that `docker compose ps` shows `db` as healthy.
- If exports remain `pending`, check `docker compose ps` for healthy `redis`, `minio`, and `worker` services and inspect `docker logs zeeus-hackathon-2026-worker-1`.
- If artifact downloads fail, confirm the `zeeus-artifacts` bucket exists in MinIO and that `S3_ENDPOINT`, `S3_BUCKET`, and credentials match the Compose defaults.
