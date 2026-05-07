# AI Product Requirement Generator

Generate structured product requirement documents from a simple idea. This repository now contains a working Next.js MVP built from the `BUILD_PLAN.md` blueprint.

## Overview

- Next.js App Router application
- Premium dark landing page and PRD input workflow
- Markdown rendering for generated documents
- Copy and PDF export
- Pollinations-based cover image route
- NYOK-compatible server integration with a local fallback generator
- Basic in-memory rate limiting

## Environment

Create `.env.local` from `.env.example` if you want to connect a real NYOK backend:

```bash
NYOK_API_URL=
NYOK_API_KEY=
NYOK_MODEL=
```

If those values are missing, the app still works by generating a deterministic fallback PRD locally.

## Run locally

```bash
npm install
npm run dev
```

## Notes

- The NYOK request payload is intentionally generic because the original plan did not define an exact API contract.
- Rate limiting is process-local. For production, replace it with a distributed limiter such as Upstash Redis.
