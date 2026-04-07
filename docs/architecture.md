# Architecture

## Goal

This codebase implements the ZEEUS Sustainability by Design assessment as a
single-tenant web application. The product goal is not a generic ESG platform.
It is a reproducible, database-backed implementation of the workbook flow with
clear UX, deterministic scoring, dashboards, and export.

## Runtime Topology

- `apps/web` serves the landing page, auth pages, evaluation workspace, wizard,
  dashboard, and report UI.
- `apps/web` reaches the API through contract-backed helpers and Next rewrites
  for `/api/*`.
- `apps/api` owns auth, persistence, scoring orchestration, evaluation
  workflows, exports, Swagger, and health endpoints.
- `packages/scoring` owns pure TypeScript scoring logic and workbook-derived
  lookup catalogs.
- `packages/contracts` defines the shared HTTP contract for web-to-API routes.
- `packages/shared` defines Zod schemas, DTOs, enums, and response shapes.
- `packages/db` owns Prisma schema, migrations, and seed data.
- PostgreSQL is the required backing service.

## Product Flow

The primary assessment flow is:

1. Startup context capture
2. Initial SDG summary
3. Stage I financial and E/S/G assessment
4. Stage II risks and opportunities
5. Impact summary
6. SDG alignment
7. Dashboard and recommendations
8. CSV export and print-to-PDF report

Saved evaluations belong to the authenticated user and can be resumed from the
workspace list.

## Module Layout

Primary API modules:

- `AuthModule`: session auth, CSRF, session management, password reset
- `EvaluationsModule`: evaluation CRUD, wizard-step persistence, report payloads
- `HealthModule`: API and database health
- `UsersModule`: profile and session data used by the web shell

Retained baseline modules:

- `AdminModule`
- `AuditModule`
- `GovernanceModule`
- `IdentityModule`
- `ObservabilityModule`
- `ProjectsModule`

Those retained modules stay available, but they are not the main hackathon
product slice.

## Data Model

The main persistence model is centered on `Evaluation` plus per-stage answer
tables:

- `Evaluation`
- `Stage1FinancialAnswer`
- `Stage1TopicAnswer`
- `Stage2RiskAnswer`
- `Stage2OpportunityAnswer`
- `SdgMapping`
- `RecommendationTemplate`

The evaluation row stores startup context plus denormalized summary metrics so
the workspace list and dashboard can render without recomputing every answer
from scratch.

## Deterministic Scoring Boundary

The scoring boundary is strict:

- workbook-derived constants and matrices live in `packages/scoring/catalog`
- pure scoring functions live in `packages/scoring/src`
- the API computes and persists canonical scores
- the UI renders results and help text

AI is intentionally out of the decision path for materiality, risk, opportunity,
and final score generation.

Priority bands remain:

- `>= 2` and `< 2.5` = `relevant`
- `>= 2.5` = `high_priority`

## Exports

- CSV export comes directly from the API for raw answers and computed scores.
- PDF v1 is implemented as a print-optimized report route under
  `/app/report/[id]`.

## Delivery Baseline

- Local reproducibility is centered on `docker compose up --build`.
- The repository still contains optional observability and Kubernetes assets,
  but the hackathon-critical delivery path is the `web + api + db` Compose
  stack.
