# Deployment

## Primary Delivery Path

The required baseline for this project is the Docker Compose stack:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

This starts:

- `db`
- `api`
- `web`

The compose path is the canonical local reproduction flow for judges and
reviewers.

## Containers

- `apps/api/Dockerfile` builds the NestJS API
- `apps/web/Dockerfile` builds the Next.js frontend
- `docker-compose.yml` wires the three required services together

The API container runs migrations and seed data before launching the server.

## Health Endpoints

- `GET /api/health`
- `GET /api/docs`
- `GET /api/metrics`

Use `/api/health` for readiness checks and basic smoke testing.

## Release Checklist

1. Confirm `.env.example` matches the expected local defaults.
2. Run `npm run typecheck`.
3. Run `npm test`.
4. Run `npm run build`.
5. Run `docker compose up --build -d`.
6. Verify the web app, API docs, and API health endpoints.
7. Confirm the seeded owner can sign in and create or resume an evaluation.
8. Confirm the dashboard, report route, and CSV export all load successfully.

## Production Notes

The repository still includes optional Kubernetes and observability assets under
`infra/`, but those are secondary to the hackathon delivery baseline. The main
priority is a reproducible Compose-based deployment that starts cleanly and
matches the documented local setup.
