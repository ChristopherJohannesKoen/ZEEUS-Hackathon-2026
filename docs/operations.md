# Operations

## Runtime Checks

Primary health endpoints:

- `http://localhost:4000/api/health`
- `http://localhost:4000/api/docs`
- `http://localhost:4000/api/metrics`
- `http://localhost:3000`

## Docker Operations

Start the full stack:

```powershell
docker compose up --build
```

Start in the background:

```powershell
docker compose up --build -d
```

Stop and remove containers:

```powershell
docker compose down --remove-orphans
```

## Database And Seed Operations

- `npm run db:setup`: migrate and seed
- `npm run db:reset`: reset and reseed
- `npm run prisma:generate`: regenerate Prisma client

The default seed creates the local owner account and populates deterministic
lookup data used by the assessment flow.

## Observability

The API exposes Prometheus-compatible metrics at `/api/metrics`.

Optional starter observability assets remain under `infra/observability`, but
they are not required for the core local stack.

## Useful Smoke Checks

- create an evaluation from `/app/evaluate/start`
- complete enough answers to reach the dashboard
- open `/app/report/[id]`
- download CSV export
- confirm saved evaluations render in `/app/evaluations`

## Common Failure Modes

- Postgres unhealthy: inspect `docker compose ps` and container logs
- Prisma client drift: rerun `npm run prisma:generate`
- missing seed data: rerun `npm run db:setup`
- workbook logic drift: rerun `node scripts/extract-workbook-catalogs.mjs`
- Windows Next build warnings: the web build falls back to the wasm SWC package
