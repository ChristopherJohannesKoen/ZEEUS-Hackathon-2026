# Local Development

## First Boot

```powershell
Copy-Item .env.example .env
npm install
npm run dev:services
npm run db:setup
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:4000/api/docs`
- `http://localhost:4000/api/health`

## Daily Commands

- `npm run dev`: run API and web together
- `npm run dev:services`: start Postgres only
- `npm run db:setup`: apply migrations and seed data
- `npm run db:reset`: reset the database
- `npm run prisma:generate`: regenerate Prisma client
- `npm run typecheck`: TypeScript checks
- `npm test`: workspace tests
- `npm run build`: production builds

## Seeded Local Login

- Email: `owner@example.com`
- Password: `ChangeMe123!`

Public signup remains enabled for normal member accounts, but the seeded owner
account is the fastest path for local verification.

## Workbook Catalog Refresh

If the workbook helper sheets change, refresh the committed scoring catalogs:

```powershell
node scripts/extract-workbook-catalogs.mjs
```

That updates the static catalog data consumed by `packages/scoring`.

## Validation Checklist

```powershell
npm run typecheck
npm test
npm run build
```

For a closer end-to-end check:

```powershell
docker compose up --build -d
docker compose ps
```

## Troubleshooting

- If Prisma complains about missing generated types, run `npm run prisma:generate`.
- If the seeded owner is missing, rerun `npm run db:setup`.
- If the web build on Windows warns about the native SWC package, the build
  falls back to the wasm compiler automatically.
- If pages cannot talk to the API, confirm `APP_URL`, `API_ORIGIN`, and the
  running ports match the actual local URLs.
- If you change workbook-derived logic, rerun `node scripts/extract-workbook-catalogs.mjs`
  and then rerun tests.
