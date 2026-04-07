# ZEEUS Hackathon Assessment Platform

This repository is the working submission codebase for the ZEEUS hackathon.
It turns the Excel-based Sustainability by Design workflow into a reproducible
web application with:

- deterministic scoring
- saved evaluations in PostgreSQL
- dashboard and report views
- CSV export and print-to-PDF output
- Docker-based local setup

## Product Scope

The implemented product flow is:

1. Public landing page
2. Authenticated evaluation workspace
3. Startup context intake
4. Initial SDG pre-screen
5. Stage I holistic startup assessment
6. Stage II risks and opportunities
7. Impact summary
8. SDG alignment
9. Results dashboard
10. Full report and export

The scoring path stays deterministic. AI is not used to decide materiality,
risk ratings, opportunity ratings, or final scores.

## Stack

- `apps/web`: Next.js 15, App Router, Tailwind, server/client contract helpers
- `apps/api`: NestJS 11, Prisma, Swagger, session auth, CSRF, idempotency
- `packages/scoring`: shared scoring engine and workbook-derived catalogs
- `packages/contracts`: ts-rest contract layer used by web and API
- `packages/shared`: shared Zod schemas, DTOs, enums, and response shapes
- `packages/db`: Prisma schema, migrations, and seed data
- `packages/ui`: reusable UI primitives
- `PostgreSQL`: required persistence layer

## Repository Layout

```text
apps/
  api/                  NestJS API
  web/                  Next.js frontend
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

Default runtime values:

- Postgres DB: `zeeus_assessment`
- Session cookie: `zeeus_assessment_session`

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

## Common Commands

- `npm run dev`: run web and API in watch mode
- `npm run dev:services`: run Postgres only
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

## Docs

- [Architecture](docs/architecture.md)
- [Environment](docs/environment.md)
- [Local Development](docs/local-development.md)
- [Deployment](docs/deployment.md)
- [Contracts](docs/contracts.md)
- [Operations](docs/operations.md)

## Notes

- The evaluation flow is the primary product slice.
- Enterprise identity, admin, and observability modules remain available in the
  codebase, but they are not the critical-path hackathon scope.
- The running application lives under `apps/` and shared packages under
  `packages/`.

## License

See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
