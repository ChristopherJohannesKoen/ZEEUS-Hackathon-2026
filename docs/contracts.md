# API Contracts

## Purpose

`packages/contracts` is the shared web-facing API contract for this repository.
It keeps the Next.js app and NestJS API aligned on route shapes, payloads, and
response schemas.

## Package Split

- `packages/shared` owns Zod schemas, enums, DTOs, and response envelopes.
- `packages/contracts` owns HTTP method, path, params, query, body, and status
  surface.

This keeps domain types reusable while still making the actual HTTP interface
explicit.

## Current Route Groups

The main contract lives in `packages/contracts/src/index.ts` and currently
includes:

- `health`
- `auth`
- `users`
- `admin`
- `evaluations`
- `projects`

`evaluations` is the primary product slice used by the hackathon app.
`projects` remains as a retained reference CRUD slice from the original
baseline.

## Evaluation Routes

The evaluation contract covers:

- create, list, and fetch evaluations
- update startup context
- fetch the summary SDG pre-screen
- save Stage I financial answers
- save Stage I topic answers
- save Stage II risk answers
- save Stage II opportunity answers
- fetch impact summary
- fetch SDG alignment
- fetch dashboard data
- fetch report data
- export CSV

## Client Rules

Use the typed helpers in:

- `apps/web/lib/server-api.ts`
- `apps/web/lib/client-api.ts`

Do not add raw `fetch('/api/...')` calls for ordinary JSON endpoints when a
contract-backed helper should exist.

## Non-JSON Responses

CSV export stays explicit as a non-JSON route. Everything else in the main
assessment flow should stay contract-backed JSON.

## Change Workflow

When adding or changing a route:

1. update `packages/shared`
2. update `packages/contracts`
3. update the Nest controller and service
4. update the web client helper
5. add or update tests
