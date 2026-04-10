---
title: ZEEUS Sustainability by Design
emoji: 🌿
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
fullWidth: true
header: mini
pinned: false
short_description: Full-stack ZEEUS demo for founders and partner programs.
tags:
  - sustainability
  - nextjs
  - nestjs
  - startup-assessment
  - full-stack
---

## ZEEUS Sustainability by Design

This Space hosts the full working ZEEUS demo stack.

What this deployment includes:

- public landing, methodology, FAQ, SDG, resource, and partner pages
- self-service signup and local login
- founder evaluation workspace with saved drafts and revisions
- impact summary, SDG alignment, dashboard, evidence, scenarios, and reports
- async CSV/PDF exports
- async narrative generation
- seeded organization, program, submission, and reviewer flows

Runtime notes:

- the Space starts PostgreSQL and Redis inside the container
- artifacts are written to the local filesystem and use `/data` automatically when persistent storage is available
- OpenAI narratives are used when `OPENAI_API_KEY` is configured; otherwise the worker falls back to the built-in deterministic explainer

Demo access:

- create your own account via the signup flow
- seeded owner account: `owner@example.com` / `ChangeMe123!`
- seeded admin account: `admin@example.com` / `ChangeMe123!`
- seeded member account: `member@example.com` / `ChangeMe123!`

Recommended Space variables:

- `OPENAI_API_KEY` if you want hosted OpenAI narratives instead of the built-in fallback
- `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` if you want to override the default owner account
