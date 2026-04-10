# Architecture

## Goal

This codebase implements the ZEEUS Sustainability by Design platform as a
single-tenant, dual-audience web application. The product goal is not a generic
ESG platform. It is a reproducible, database-backed implementation of the
workbook flow with a public methodology site, founder workspace, partner review
surfaces, deterministic scoring, dashboards, and export.

## Runtime Topology

- `apps/web` serves the landing page, methodology/FAQ/resources/partner pages,
  auth pages, evaluation workspace, evidence vault, scenario lab, partner
  program console, benchmarks, and report UI.
- `apps/web` reaches the API through contract-backed helpers and Next rewrites
  for `/api/*`.
- `apps/api` owns auth, persistence, scoring orchestration, evaluation
  workflows, revision snapshots, queue orchestration, Swagger, and health endpoints.
- `apps/worker` owns async artifact generation, report-to-PDF rendering, CSV
  serialization, and AI narrative generation.
- `packages/scoring` owns pure TypeScript scoring logic and workbook-derived
  lookup catalogs.
- `packages/contracts` defines the shared HTTP contract for web-to-API routes.
- `packages/shared` defines Zod schemas, DTOs, enums, and response shapes.
- `packages/db` owns Prisma schema, migrations, and seed data.
- PostgreSQL is the required backing service.
- Redis backs the BullMQ job queue.
- MinIO is the default local S3-compatible object store for revision artifacts.

## Product Flow

The primary assessment flow is:

1. Startup context capture
2. Initial SDG summary
3. Stage I financial and E/S/G assessment
4. Stage II risks and opportunities
5. Impact summary
6. SDG alignment and goal/target exploration
7. Dashboard, structured recommendations, evidence vault, and scenario lab
8. Review before completion
9. Immutable revisions, compare view, and revision-scoped recommendation actions
10. Persisted CSV/PDF artifacts, AI narratives, and seeded benchmark comparisons
11. Organization and partner-program submission/review surfaces

Saved evaluations remain user-authenticated and are linked to the user primary
organization when one exists.

## Module Layout

Primary API modules:

- `AuthModule`: session auth, CSRF, session management, password reset
- `EvaluationsModule`: evaluation CRUD, wizard-step persistence, report payloads
- `PlatformModule`: public content, SDG targets, organizations, programs, evidence, scenarios
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
- `EvaluationNarrative`
- `EvaluationRecommendationAction`
- `Organization`
- `OrganizationMember`
- `OrganizationInvitation`
- `Program`
- `ProgramMember`
- `ProgramSubmission`
- `ReviewAssignment`
- `ReviewComment`
- `EvidenceAsset`
- `KnowledgeArticle`
- `FaqEntry`
- `CaseStudy`
- `SdgTarget`
- `ScenarioRun`
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
Narrative rows track queued or completed AI explanations for specific revisions.
Organization and program models add the dual-audience layer without allowing
review workflows to mutate canonical scoring outputs.

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

- CSV and PDF are generated as persisted artifacts tied to a specific revision.
- Artifact jobs are queued in Redis and executed by `apps/worker`.
- Artifact binaries are stored in object storage through the storage abstraction:
  MinIO locally, S3-compatible storage in production.
- PDF rendering uses the same `ReportDocument` source as the branded report UI.
- The report route under `/app/report/[id]` remains the branded presentation
  view, and the worker uses an internal render route for HTML-to-PDF generation.

## Revision Semantics

- Draft revisions are mutable and owned by the active evaluation.
- Completed revisions are immutable snapshots.
- Reopening clones the latest completed revision into a new draft revision.
- Recommendation actions, narratives, artifacts, benchmarks, compare results,
  and report views are revision-scoped. Completed history is not overlaid with
  live mutable state.

## Delivery Baseline

- Local reproducibility is centered on `docker compose up --build`.
- The default supported stack is `web + api + db + worker + redis + minio`.
- Optional observability and Kubernetes assets remain under `infra/`, but they
  are not part of the core assessment acceptance path.
