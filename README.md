# Camping Logbook

A mobile-first PWA for logging caravan/camping trips: where and when you camped, ratings and notes, photos, a map of every site, spend/nights stats, and an Excel export for backup. Built as a shared household logbook — any logged-in user can see and edit every trip, there's no per-user private data.

## Stack

- **Backend**: FastAPI + SQLAlchemy + Alembic + PostgreSQL, JWT auth
- **Frontend**: React + TypeScript + Vite, React Query, React Hook Form + Zod, React Leaflet
- **PWA**: `vite-plugin-pwa` with a custom service worker (cache-first app shell, network-first `GET /api/*`, Android share-target support)
- **Deployment**: Docker Compose (`db`, `backend`, `frontend`), designed to sit behind an existing reverse proxy (e.g. Nginx Proxy Manager) that terminates TLS — the stack itself only publishes one plain HTTP port

## Features

- Trip CRUD with flexible price entry (total for the stay, or per-night — nights and totals are derived/computed, never both stored redundantly)
- Map with GPS "use my location" pin dropping, draggable marker, and a map view of every trip
- Photo upload per trip (plain file input, works everywhere) plus Android share-target (share photos from Gallery/Camera straight into the app)
- Filterable timeline (date range + text search)
- Stats page: trip count, nights, spend, average price/night, average rating, and a monthly nights chart, for any date range (defaults to the current year)
- Excel export (`.xlsx`) of all trips — defaults to all-time as a backup, with an optional date range; documents its own schema on a readme sheet
- Installable as a PWA on Android and iOS

## Quick start

```bash
cp .env.example .env
# edit .env and set real values for POSTGRES_PASSWORD and JWT_SECRET

docker compose up -d --build
```

This starts three services:

| Service | Purpose |
|---|---|
| `db` | PostgreSQL 16 |
| `backend` | FastAPI, runs `alembic upgrade head` on startup, not published to the host |
| `frontend` | nginx serving the built React app, proxies `/api/*` to `backend`, publishes `FRONTEND_PORT` (default `8080`) |

Once it's up, visit `http://localhost:8080` (or your `FRONTEND_PORT`).

### Create a login

There's no self-registration — accounts are seeded via a CLI script, run inside the backend container:

```bash
docker compose exec backend python -m scripts.create_user <username> ["Display Name"]
```

It prompts for a password interactively.

## Configuration

All configuration lives in `.env` (see `.env.example` for every variable):

| Variable | Purpose |
|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Postgres credentials |
| `DATABASE_URL` | SQLAlchemy connection string used by the backend |
| `JWT_SECRET` | Signing secret for auth tokens — set this to a long random string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime (default 7 days) |
| `PHOTO_STORAGE_PATH` | Where uploaded photos are stored inside the backend container (backed by the `photo_uploads` volume) |
| `FRONTEND_PORT` | The single host port to publish — point your reverse proxy here |

## Project layout

```
backend/
  app/
    models/       SQLAlchemy models (user, trip, campsite, photo)
    schemas/      Pydantic request/response schemas
    routers/      FastAPI route handlers (auth, trips, photos, stats, export)
    services/     Business logic (price/nights normalization, photo storage, stats, xlsx export)
  alembic/        DB migrations
  scripts/        create_user CLI
  tests/          pytest suite (runs against a real Postgres instance, transaction-rolled-back per test)

frontend/
  src/
    api/          fetch wrappers per resource
    hooks/        React Query hooks
    context/      auth context (JWT in localStorage)
    pages/        route-level components
    components/   layout, map, photo, and stats components
    sw.ts         custom service worker (Workbox injectManifest)
```

## Running the backend tests

The models use Postgres-specific types, so tests run against the real `db` service (each test wrapped in a rolled-back transaction, not against a separate database):

```bash
docker compose run --rm -e PHOTO_STORAGE_PATH=/tmp/test_photos backend sh -c \
  "pip install --no-cache-dir pytest httpx pytest-cov -q && python -m pytest -q"
```

## Deployment notes

This stack is meant to run on a Linux server behind an existing reverse proxy that handles HTTPS (e.g. Nginx Proxy Manager) — point it at whatever host port `FRONTEND_PORT` publishes. The frontend container's nginx handles the `/api/*` proxy internally and serves `/photos/*` directly from the shared `photo_uploads` volume.
