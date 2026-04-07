# ZEEUS Hackathon Assessment Platform

A Dockerized single-tenant assessment platform for the ZEEUS hackathon. The app reproduces the Excel-based startup sustainability workflow as a Next.js + NestJS + PostgreSQL product with deterministic scoring, saved evaluations, dashboard outputs, and export-ready report views.

## Stack

- `apps/web`: Next.js 15 App Router, Tailwind, shared UI package, protected assessment workspace, wizard flow, dashboard, and print-friendly report route
- `apps/api`: NestJS 11, Prisma, Postgres, Swagger, session-cookie auth, CSRF protection, idempotency, rate limiting, audit logging, and deterministic scoring-backed evaluation endpoints
- `packages/scoring`: shared scoring engine and workbook-derived catalog package used by both the API and web
- `packages/contracts`: shared ts-rest contract router for website-facing API calls
- `packages/db`: shared Prisma schema, migrations, seed flow
- `packages/shared`: shared Zod contracts and DTO types
- `packages/ui`: reusable UI primitives and styling helpers
- `packages/config`: shared ESLint, Prettier, and TypeScript config

## What The App Does

- public landing page and authenticated workspace
- startup context intake with NACE division, stage, offering type, launch status, and innovation approach
- initial SDG pre-screen built from startup stage plus NACE business mappings
- Stage I financial scoring and inside-out environmental, social, and governance assessment
- Stage II outside-in sustainability risks and opportunities
- impact summary, SDG alignment, dashboard, recommendations, CSV export, and print-to-PDF report route
- workbook snapshot extraction script at `scripts/extract-workbook-catalogs.mjs`
- saved evaluations backed by PostgreSQL
- deterministic scoring only for final outputs; no AI in the scoring path

## Scoring Notes

- Stage I financial indicators use fixed workbook-aligned lookup levels.
- Stage I E/S/G indicators use `((Magnitude + Scale + Irreversibility) / 3) × Likelihood`.
- The UI preserves the requested threshold split:
  - `>= 2` and `< 2.5` = `relevant`
  - `>= 2.5` = `high_priority`
- Stage II risk and opportunity outputs use deterministic matrix lookups from the shared scoring catalog.
- Confidence and sensitivity are additive guidance signals only and do not change canonical scores.

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

- web: `http://localhost:3000`
- API docs: `http://localhost:4000/api/docs`
- health: `http://localhost:4000/api/health`

Seeded owner credentials come from `.env`:

- email: `owner@example.com`
- password: `ChangeMe123!`

The seed also creates a sample evaluation so the dashboard and report routes have realistic data immediately after setup.

`APP_ENV` is the deployment-security axis:

- `local` for developer machines
- `test` for automated test harnesses
- `staging` and `production` for strict deploy targets

Local-only toggles such as `ALLOW_MISSING_ORIGIN_FOR_DEV` and `EXPOSE_DEV_RESET_DETAILS` now fail fast outside their allowed environments.

### Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The Compose stack starts Postgres, runs migrations and seeding in the API container, then serves:

- web on `http://localhost:3000`
- API on `http://localhost:4000`

### Windows + WSL

If you run the repo from WSL, use Linux shell commands inside WSL and make sure Docker Desktop has WSL integration enabled for your distro. Typical flow:

```bash
cp .env.example .env
docker compose up --build
```

## Common Commands

- `npm run dev`: start web and API in watch mode
- `npm run dev:services`: start Postgres only
- `npm run db:setup`: run local migrations and seed data
- `npm run db:reset`: reset the database and reseed it
- `npm run lint`: run ESLint and Prisma validation
- `npm run typecheck`: run TypeScript and Prisma validation
- `npm test`: run workspace Vitest suites
- `npm run test:e2e`: run the full Playwright E2E suite
- `npm run test:e2e:enterprise`: run the enterprise-login Playwright smoke under the OIDC-first enterprise profile
- `npm run docs:check`: run markdown lint and internal link validation
- `npm run test:perf:smoke`: run the smoke-level k6 performance scenario
- `npm run test:perf:critical`: run the deeper critical auth/session/project API performance scenario
- `npm run perf:up`: start the Compose stack with the local perf env overlay for K6 runs
- `npm run perf:down`: stop the local perf stack
- `npm run build`: produce production builds for every workspace
- `npm run docker:up`: build and start the Compose stack
- `npm run docker:down`: stop and clean up Compose containers
- `node scripts/extract-workbook-catalogs.mjs`: snapshot helper sheets from the reference workbook into `packages/scoring/catalog/workbook-snapshot.json`

## Repository Layout

```text
apps/
  api/                  NestJS API
  web/                  Next.js application
packages/
  config/               Shared ESLint, Prettier, and TS config
  contracts/            ts-rest API contract package
  db/                   Prisma schema, migrations, seed script
  scoring/              Deterministic scoring engine and workbook-derived catalogs
  shared/               Zod schemas and shared DTO types
  ui/                   Reusable UI primitives
vendor/
  nestjs-config/        Temporary vendored @nestjs/config security patch
  nestjs-swagger/       Temporary vendored @nestjs/swagger security patch
docs/
  architecture.md
  code-critique.md
  reference-baseline.md
  environment.md
  local-development.md
  deployment.md
  contracts.md
  web-hardening.md
  testing-and-failpoints.md
  template-conventions.md
  customization-checklist.md
infra/
  compose/              Optional extension services
  k8s/                  Kubernetes production baseline
scripts/
  with-env.mjs          Shared env loader for workspace commands
```

## Docs

- [Reference Baseline](docs/reference-baseline.md)
- [Architecture](docs/architecture.md)
- [Code Critique](docs/code-critique.md)
- [Environment Catalog](docs/environment.md)
- [Local Development Runbook](docs/local-development.md)
- [Migrations](docs/migrations.md)
- [Deployment Runbook](docs/deployment.md)
- [API Contract Guide](docs/contracts.md)
- [Enterprise Identity Guide](docs/enterprise-identity.md)
- [Governance And Compliance Guide](docs/governance-and-compliance.md)
- [Control And Evidence Matrix](docs/control-evidence-matrix.md)
- [Kubernetes Deployment Baseline](docs/kubernetes-baseline.md)
- [Web Hardening Guide](docs/web-hardening.md)
- [Testing And Failpoint Guide](docs/testing-and-failpoints.md)
- [Operations Guide](docs/operations.md)
- [Template Conventions](docs/template-conventions.md)
- [ADR 001](docs/adrs/001-template-scope.md)
- [ADR 002](docs/adrs/002-enterprise-identity.md)
- [ADR 003](docs/adrs/003-kubernetes-production-baseline.md)
- [ADR 004](docs/adrs/004-release-integrity.md)
- [Customization Checklist](docs/customization-checklist.md)

## Built From

This template was shaped against a private research archive of open-source
repositories, official documentation, and public issue discussions, not copied
from a single starter. The public provenance map of direct donors, validation
references, and intentionally unadopted patterns is in
[Reference Baseline](docs/reference-baseline.md).

## Dependency Security Notes

The repo currently vendors patched copies of `@nestjs/config` and
`@nestjs/swagger` under `vendor/` because their published manifests still pin
vulnerable transitive versions of `lodash` and `path-to-regexp`. Only package
manifests were changed; runtime code remains the upstream package build output.

See [`vendor/README.md`](vendor/README.md) for the exact patched dependencies
and remove the vendored copies once upstream publishes equivalent fixes.

## License

This repository is source-available under the terms in [LICENSE](LICENSE).

- personal, self-study, research, classroom, and academic use are allowed
- commercial, entrepreneurial, startup, agency, client, or corporate use
  requires prior written permission
- vendored third-party materials remain under their own upstream licenses

See:

- [LICENSE](LICENSE)
- [COMMERCIAL-LICENSING.md](COMMERCIAL-LICENSING.md)
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- [CLA.md](CLA.md)

This project is developed in a personal capacity; affiliations do not imply
endorsement by Stellenbosch University.

External code contributions require agreement to the repository
[CLA](CLA.md) before merge.
