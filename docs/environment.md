# Environment

Copy `.env.example` to `.env` before running the project locally.

```powershell
Copy-Item .env.example .env
```

## Required Local Variables

These values are enough for the default local stack:

| Variable                        | Purpose                         | Default                                                                        |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `APP_ENV`                       | runtime posture                 | `local`                                                                        |
| `APP_URL`                       | public web origin               | `http://localhost:3000`                                                        |
| `API_ORIGIN`                    | API origin used by the web tier | `http://localhost:4000`                                                        |
| `API_PORT`                      | Nest listen port                | `4000`                                                                         |
| `WEB_PORT`                      | Next listen port                | `3000`                                                                         |
| `POSTGRES_USER`                 | Postgres username               | `postgres`                                                                     |
| `POSTGRES_PASSWORD`             | Postgres password               | `postgres`                                                                     |
| `POSTGRES_DB`                   | Postgres database name          | `zeeus_assessment`                                                             |
| `DATABASE_URL`                  | Prisma connection string        | `postgresql://postgres:postgres@localhost:5432/zeeus_assessment?schema=public` |
| `SESSION_COOKIE_NAME`           | session cookie key              | `zeeus_assessment_session`                                                     |
| `SESSION_COOKIE_ENCRYPTION_KEY` | 64-hex cookie encryption key    | required                                                                       |
| `SEED_OWNER_EMAIL`              | seeded owner account email      | `owner@example.com`                                                            |
| `SEED_OWNER_PASSWORD`           | seeded owner account password   | `ChangeMe123!`                                                                 |

## Assessment-Relevant Runtime Settings

| Variable                    | Purpose                                 | Default    |
| --------------------------- | --------------------------------------- | ---------- |
| `EXPORT_SYNC_LIMIT`         | max synchronous CSV size                | `5000`     |
| `RATE_LIMIT_WINDOW_MS`      | throttle window                         | `60000`    |
| `RATE_LIMIT_MAX`            | request ceiling per window              | `120`      |
| `SESSION_ROTATION_MS`       | session rotation window                 | `43200000` |
| `SESSION_TOUCH_INTERVAL_MS` | session freshness write throttle        | `600000`   |
| `SESSION_MAX_ACTIVE`        | max concurrent sessions per user        | `5`        |
| `OWNER_STEP_UP_WINDOW_MS`   | freshness window for owner confirmation | `900000`   |

## Docker Compose Defaults

`docker-compose.yml` injects working defaults for local use:

- database name: `zeeus_assessment`
- session cookie name: `zeeus_assessment_session`
- API port: `4000`
- web port: `3000`

The API container runs Prisma migrate + seed before starting the server.

## Test And Perf Env Files

- `.env.e2e.example`: Playwright and test harness defaults
- `.env.e2e.enterprise.example`: enterprise-login test coverage
- `.env.perf.example`: k6 performance overlay

Keep those files as examples only. The normal local dev path still starts from
`.env.example`.

## Optional Inherited Variables

The repository still contains optional envs for:

- enterprise identity
- feature-flagged email, storage, cache, and observability integrations
- CSP reporting

Those are not required for the hackathon-critical stack and can stay disabled in
local development.
