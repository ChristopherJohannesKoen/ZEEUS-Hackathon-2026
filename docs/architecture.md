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
7. Dashboard and structured recommendations
8. Review before completion
9. Immutable revisions, compare view, and persisted CSV/PDF artifacts

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

Those retained modules stay available, but they are not the main hackathon
product slice.

## Data Model

The main persistence model is centered on `Evaluation` plus per-stage answer
tables:

- `Evaluation`
- `EvaluationRevision`
- `EvaluationArtifact`
- `EvaluationRecommendationAction`
- `Stage1FinancialAnswer`
- `Stage1TopicAnswer`
- `Stage2RiskAnswer`
- `Stage2OpportunityAnswer`
- `SdgMapping`
- `RecommendationTemplate`

The evaluation row stores startup context plus denormalized summary metrics so
the workspace list and dashboard can render without recomputing every answer
from scratch. Immutable revision snapshots preserve completed outputs, while
artifact rows track persisted CSV/PDF generation for specific revisions.

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

- CSV and PDF are generated as persisted artifacts tied to the active revision.
- Artifact binaries are stored under `ARTIFACTS_DIR` and mounted to the Docker
  `artifacts_data` volume in the default Compose stack.
- The report route under `/app/report/[id]` remains the branded presentation
  view for completed results and revision snapshots.

## Delivery Baseline

- Local reproducibility is centered on `docker compose up --build`.
- The default supported stack is `web + api + db` plus a persistent artifacts
  volume.
- Optional observability and Kubernetes assets remain under `infra/`, but they
  are not part of the core assessment acceptance path.
