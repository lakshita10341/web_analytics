# Web Analytics – Full‑Stack App

A production‑ready web analytics platform built with a Django REST API and a modern Next.js frontend. It provides JWT‑based authentication, site management, and analytics visualization. Containerized with Docker and orchestrated via docker‑compose for easy local development.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Layout](#monorepo-layout)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
  - [Backend (Django + DRF)](#backend-django--drf)
  - [Frontend (Next.js)](#frontend-nextjs)
- [Running Migrations](#running-migrations)
- [API Overview](#api-overview)
- [Development Workflow](#development-workflow)

## Features
- **JWT auth (access + refresh)** via `djangorestframework-simplejwt`.
- **Site management** endpoint (e.g., `create_site`) from the analytics app.
- **Modern UI** with Next.js 15, React 19, Tailwind CSS 4.
- **Robust API client** with Axios instance, typed interceptors, and token refresh.
- **Dockerized** backend and frontend; `docker-compose` spins up both.
- **CORS configured** for local development and Vercel preview domains.

## Architecture
- **Backend**: Django + DRF in `backend/` exposes REST endpoints and handles auth.
- **Frontend**: Next.js app in `web_analytics_frontend/` consumes the API.
- **Reverse**: Each service runs on its own port (backend: 8000, frontend: 3000).

```text
web_analytics/
├─ backend/
│  ├─ analytics/                # Django app with models, serializers, views
│  ├─ web_analytics_backend/    # Django project (settings, urls, wsgi)
│  ├─ manage.py
│  ├─ requirements.txt
│  └─ Dockerfile
├─ web_analytics_frontend/
│  ├─ src/                      # Next.js app source
│  ├─ package.json
│  └─ Dockerfile
├─ docker-compose.yml           # Orchestrates backend and frontend
├─ .env.example                 # Sample env vars for both services
└─ Readme.md
```

## Tech Stack
- **Backend**: Django 5, DRF, SimpleJWT, `dj-database-url`, Postgres/SQLite
- **Frontend**: Next.js 15, React 19, Tailwind 4, Axios
- **Infra**: Docker, docker‑compose, Gunicorn (prod server)

## Prerequisites
- Docker Desktop (for Docker setup)
- OR
  - Python 3.11+
  - Node.js 20+ and npm 10+
  - A Postgres database URL if not using SQLite locally

## Environment Variables
Copy `.env.example` to `.env` at repo root and fill in values you have. docker‑compose will read from your shell environment; you can also add an `.env` file at the project root.

- Backend
  - `SECRET_KEY` – Django secret key
  - `SUPABASE_DB_URL` or `DATABASE_URL` – Postgres connection string (e.g., `postgres://user:pass@host:5432/db`)

- Frontend
  - `NEXT_PUBLIC_API_BASE` – Base URL for the API used by the Next.js app. Example:
    - Local: `http://localhost:8000/api`
    - Hosted: `https://lakshitajain.pythonanywhere.com/api`

Note: The frontend API client defaults to `https://lakshitajain.pythonanywhere.com/api` if `NEXT_PUBLIC_API_BASE` is not set. Override it in local/dev.

## Quick Start (Docker)
Run both services with one command:

```bash
docker compose up --build
```

- Backend runs at http://localhost:8000/
- Frontend runs at http://localhost:3000/

`docker-compose.yml` mounts `./backend` into the backend container for hot‑reload of code during local development, and starts Gunicorn after running migrations.

## Manual Setup
### Backend (Django + DRF)
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate   # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure env vars in your shell or use a .env loader
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver 0.0.0.0:8000
```
The API will be available at `http://localhost:8000/api/` (depending on your `urls.py`).

### Frontend (Next.js)
```bash
cd web_analytics_frontend
npm install
# Set NEXT_PUBLIC_API_BASE in your env or a .env.local file
npm run dev
```
Frontend will be available at `http://localhost:3000/`.

## Running Migrations
With Docker Compose (runs automatically on start):
```bash
docker compose run --rm backend python manage.py migrate
```
Without Docker:
```bash
cd backend
python manage.py migrate
```

## API Documentation

The backend provides a JWT-secured REST API for authentication, site management, and analytics.

### Auth
- `POST /api/signup/` – register a new user
- `POST /api/login/` – obtain access + refresh tokens
- `POST /api/token/refresh/` – refresh access token

### Sites
- `GET /api/sites/` – list user’s sites
- `POST /api/create_site/` – create a new site
- `GET /api/tracker/` – serve embeddable tracking snippet

### Tracking
- `POST /track/` – ingest a tracking event

### Analytics (all endpoints take `site_id`)
- `GET /api/analytics/pages/<site_id>/` – top pages, views trend  
- `GET /api/analytics/sessions/<site_id>/` – session count + avg. duration  
- `GET /api/analytics/new-vs-returning/<site_id>/` – breakdown of new vs returning users  
- `GET /api/analytics/sources/<site_id>/` – traffic sources (referrers/UTMs)  
- `GET /api/analytics/devices/<site_id>/` – device + OS distribution  
- `GET /api/analytics/browsers/<site_id>/` – browser distribution  
- `GET /api/analytics/geography/<site_id>/` – geo breakdown by country/region  
- `GET /api/analytics/kpis/<site_id>/` – high-level KPIs (page views, active users, bounce rate, etc.)

### Interactive Docs
- Swagger UI → `/swagger/`  
- ReDoc → `/redoc/`  
CORS is enabled for local development hosts and Vercel preview URLs (see `backend/web_analytics_backend/settings.py`).

## API Overview
Key elements (non-exhaustive):

- **Auth (JWT)** via SimpleJWT
  - `POST /api/token/` – obtain access and refresh tokens
  - `POST /api/token/refresh/` – refresh access token
- **Analytics**
  - `POST /api/create_site/` – create a new site record
  - `POST /api/events/` – ingest a tracking event
  - `GET /api/overview/?days=30` – overall metrics (page views, sessions, users)
  - `GET /api/pages/?days=30` – top pages
  - `GET /api/sources/?days=30` – traffic sources
  - `GET /api/devices/?days=30` – device + OS distribution
  - `GET /api/browsers/?days=30` – browser family/version distribution
  - `GET /api/geo/?days=30` – country/region distribution

### Interactive API Docs
- **Swagger UI** → [http://localhost:8000/swagger/](http://localhost:8000/swagger/)  
- **ReDoc UI** → [http://localhost:8000/redoc/](http://localhost:8000/redoc/)  

Both Swagger and ReDoc are generated automatically from DRF viewsets and serializers.

---

## Screenshots

### 🔑 Authentication Flow
![Login Screen](./screenshots/login.png)

### 📊 Dashboard Overview
![Dashboard](./screenshots/site.png)

### 📈 Page Views 
![Page Views Graph](./screenshots/pageview.png)

---

## Development Workflow
- **Frontend API client**: `web_analytics_frontend/src/lib/api.ts`
  - Dedicated Axios instance configured with `baseURL = NEXT_PUBLIC_API_BASE`.
  - Request interceptor injects `Authorization: Bearer <token>` header from `localStorage`.
  - Response interceptor auto‑refreshes tokens on 401 and retries the original request.
- **Styling**: Tailwind CSS 4 is set up (see `src/app/globals.css`).
- **Scripts**:
  - Frontend: `npm run dev`, `npm run build`, `npm start`
  - Backend: `python manage.py runserver` or via Docker (Gunicorn in compose)

---

If you need help extending features (e.g., events tracking, dashboards, multi‑tenant sites), open an issue or reach out.