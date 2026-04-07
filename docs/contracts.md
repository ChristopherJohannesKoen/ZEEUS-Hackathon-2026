# API Contracts

## Purpose

`packages/contracts` is the shared web-facing API contract for this repository.
It keeps the Next.js app and NestJS API aligned on route shapes, payloads, and
response schemas.

## Package Split

- `packages/shared` owns Zod schemas, enums, DTOs, response envelopes, and
  evaluation/report domain types.
- `packages/contracts` owns HTTP method, path, params, query, body, and status
  surface.

This keeps domain types reusable while still making the actual HTTP interface
explicit.

## Active Route Groups

The main contract lives in `packages/contracts/src/index.ts` and currently
includes:

- `health`
- `auth`
- `users`
- `admin`
- `evaluations`

`evaluations` is the primary product slice for the ZEEUS assessment platform.

## Evaluation Routes

The evaluation contract covers:

- create, list, and fetch evaluations
- update startup context
- fetch the summary SDG pre-screen
- save Stage I transactionally with combined financial and topic answers
- save Stage II transactionally with combined risk and opportunity answers
- fetch impact summary
- fetch SDG alignment
- fetch dashboard data
- fetch report data
- complete, reopen, archive, and unarchive evaluations
- list revision snapshots and fetch a specific revision snapshot
- export CSV
- export PDF

Compatibility endpoints for split Stage I and Stage II saves still exist for one
transition window, but the product should use the combined step routes.

## Client Rules

Use the typed helpers in:

- `apps/web/lib/server-api.ts`
- `apps/web/lib/client-api.ts`

Do not add raw `fetch('/api/...')` calls for ordinary JSON endpoints when a
contract-backed helper should exist.

## Non-JSON Responses

CSV and PDF exports stay explicit as non-JSON routes. Everything else in the
main assessment flow should stay contract-backed JSON.

## Change Workflow

When adding or changing a route:

1. update `packages/shared`
2. update `packages/contracts`
3. update the Nest controller and service
4. update the web client helper
5. add or update tests
