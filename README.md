# ZEEUS Hackathon Assessment Platform

This repository is the working submission codebase for the ZEEUS hackathon.
It turns the Excel-based Sustainability by Design workflow into a reproducible
web application with:

- a public website for methodology, FAQ, resources, and partner onboarding
- deterministic scoring
- saved evaluations in PostgreSQL
- organization, program, evidence, and scenario workflows
- immutable revision history and comparison
- dashboard, review, benchmark, and report views
- persisted CSV and PDF export artifacts backed by object storage
- async worker-driven PDF rendering and AI narratives
- Docker-based local setup

## Product Scope

The implemented product flow is:

1. Public landing page
2. Public methodology, FAQ, SDG/ESRS, case-study, resources, partner, and contact pages
3. Authenticated evaluation workspace
4. Organization and partner-program workspace views
5. Startup context intake
6. Initial SDG pre-screen
7. Stage I holistic startup assessment
8. Stage II risks and opportunities
9. Impact summary
10. SDG alignment plus goal/target explorer
11. Results dashboard, evidence vault, and scenario lab
12. Pre-completion review
13. Full report, revision history, compare view, benchmark view, and export artifacts

The scoring path stays deterministic. AI is not used to decide materiality,
risk ratings, opportunity ratings, or final scores.

## Stack

- `apps/web`: Next.js 15, App Router, Tailwind, server/client contract helpers
- `apps/api`: NestJS 11, Prisma, Swagger, session auth, CSRF, idempotency
- `apps/worker`: BullMQ worker for export jobs and narrative generation
- `packages/scoring`: shared scoring engine and workbook-derived catalogs
- `packages/contracts`: ts-rest contract layer used by web and API
- `packages/shared`: shared Zod schemas, DTOs, enums, and response shapes
- `packages/db`: Prisma schema, migrations, and seed data
- `packages/ui`: reusable UI primitives
- `PostgreSQL`: required persistence layer
- `Redis`: async job queue backing service
- `MinIO`: local S3-compatible artifact storage

## Repository Layout

```text
apps/
  api/                  NestJS API
  web/                  Next.js frontend
  worker/               BullMQ async export and narrative worker
packages/
  config/               Shared TS, ESLint, and Prettier config
  contracts/            Shared HTTP contract layer
  db/                   Prisma schema, migrations, seeds
  scoring/              Deterministic scoring engine and catalogs
  shared/               Shared schemas and DTOs
  ui/                   Shared UI primitives
docs/
  architecture.md
  contracts.md
  deployment.md
  environment.md
  local-development.md
  operations.md
scripts/
  extract-workbook-catalogs.mjs
  ensure-next-wasm-fallback.mjs
  with-env.mjs
```

## Quick Start

### Local development

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

### Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The Compose stack starts:

- `db` on port `5432`
- `api` on port `4000`
- `web` on port `3000`
- `redis` for queued jobs
- `minio` for persisted CSV/PDF artifact storage
- `worker` for async PDF rendering, CSV generation, and AI narratives

Default runtime values:

- Postgres DB: `zeeus_assessment`
- Session cookie: `zeeus_assessment_session`
- MinIO bucket: `zeeus-artifacts`
- Internal render origin: `http://web:3000`

## Scoring Summary

- Stage I financial answers use fixed level-to-score mappings.
- Stage I E/S/G answers use:

```text
((Magnitude + Scale + Irreversibility) / 3) x Likelihood
```

- Priority bands are preserved exactly:
  - `>= 2` and `< 2.5` = `relevant`
  - `>= 2.5` = `high_priority`
- Stage II risks and opportunities use deterministic matrix lookups.
- Confidence and sensitivity hints are explanatory only and never change saved
  scores.
- Benchmarks are derived from immutable revision snapshots and seeded baseline
  profiles. They never change canonical saved results.
- AI narratives are generated from immutable revision snapshots, linked evidence, and structured guidance content
  metadata only. They do not participate in scoring.

## Common Commands

- `npm run dev`: run web and API in watch mode
- `npm run dev:services`: run Postgres, Redis, MinIO, and bucket init
- `npm run db:setup`: migrate and seed the local database
- `npm run db:reset`: reset and reseed the database
- `npm run prisma:generate`: regenerate Prisma client
- `npm run lint`: run lint checks
- `npm run typecheck`: run TypeScript checks
- `npm test`: run workspace test suites
- `npm run build`: build all workspaces
- `npm run docker:up`: build and start the Compose stack
- `npm run docker:down`: stop the Compose stack
- `node scripts/extract-workbook-catalogs.mjs`: refresh workbook catalog data

## Validation

Recommended verification before a handoff or submission:

```powershell
npm run typecheck
npm test
npm run build
docker compose up --build -d
docker compose ps
```

Health checks:

- `http://localhost:4000/api/health`
- `http://localhost:4000/api/docs`
- `http://localhost:3000`
- generate a CSV or PDF artifact from the dashboard or review screen and confirm it remains downloadable from revision history after restarting `api` and `worker`
- request an AI narrative from the dashboard and confirm it transitions from `pending` to `ready`
- verify the benchmark view loads for the active revision
- verify the public methodology, FAQ, resources, and partner pages load
- verify the evidence vault and scenario lab work for a saved evaluation
- verify the partner program console loads seeded submission and review data

## Docs

- [Architecture](docs/architecture.md)
- [Environment](docs/environment.md)
- [Local Development](docs/local-development.md)
- [Deployment](docs/deployment.md)
- [Contracts](docs/contracts.md)
- [Operations](docs/operations.md)

## Notes

- The evaluation flow remains the deterministic core product slice.
- The platform now includes public content, organization scaffolding, partner programs, evidence vault items, and advisory scenario runs.
- Enterprise identity, admin, and observability modules remain available in the
  codebase, but they are not the critical-path hackathon scope.
- Completed revisions are audit-stable. Reports, compare views, artifacts, AI
  narratives, and benchmarks all read from immutable revision snapshots.
- The running application lives under `apps/` and shared packages under
  `packages/`.

## License

See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
