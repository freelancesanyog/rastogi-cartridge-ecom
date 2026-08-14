# Rastogi cartridges | Production-Grade E-Commerce Platform

A high-performance, production-ready, multi-category e-commerce platform specializing in printer cartridges, monitors, keyboards, mice, and computer components. Built with Python 3.12, Django 5.x, Django REST Framework, PostgreSQL 16, Redis, Celery, and Next.js 14+ (App Router, TypeScript, Tailwind CSS).

---

## 🌟 Key Features

- **Decoupled Architecture**: Modular Django REST API backend + Next.js 14+ SSR/ISR frontend.
- **Printer Cartridge Compatibility Engine**: Category-driven host device mapping (`printer brand -> model -> guaranteed fitting cartridges`).
- **Concurrency-Safe Stock Management**: Inventory reservation and deduction protected by PostgreSQL row-level locks (`select_for_update`) to prevent overselling.
- **Pluggable Payment Gateway Abstraction**: Extensible gateway interface currently active with Cash on Delivery (COD) and ready for online payment widgets (Razorpay, UPI).
- **Authentication**: JWT auth with short-lived in-memory access tokens and HttpOnly refresh cookies with auto-rotation on `401 Unauthorized`.
- **Promotions & Coupons**: Flexible flat and percentage discount engine with min subtotal and usage limits.
- **SEO & Core Web Vitals**: Next.js Server Components, ISR (60s revalidation), dynamic `generateMetadata`, JSON-LD structured data (Product, Offer, BreadcrumbList, Organization), dynamic `sitemap.xml`, `robots.txt`, and zero-CLS `next/image` optimization.
- **Observability**: OpenAPI 3.0 / Swagger UI documentation at `/api/docs/`, Sentry error tracking, and health check endpoints `/api/v1/health/` and `/api/health`.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Python 3.12, Django 5.1, Django REST Framework, Gunicorn
- **Database**: PostgreSQL 16
- **Caching & Async**: Redis 7, Celery 5.4, Celery Beat
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, TanStack Query v5, Zustand v4, Lucide Icons
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD, Sentry SDK

---

## 📋 Environment Variables Reference

### Backend Environment Variables (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DJANGO_SETTINGS_MODULE` | Django settings file | `config.settings.dev` |
| `SECRET_KEY` | Secret key for Django cryptographic signing | `dev-secret-key-change-in-prod` |
| `DEBUG` | Debug mode boolean | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgres://ecom_user:ecom_pass@localhost:5432/ecom_db` |
| `REDIS_URL` | Redis cache URL | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Redis Celery broker URL | `redis://localhost:6379/1` |
| `COD_MAX_ORDER_VALUE` | Max subtotal threshold for COD orders | `50000.00` |
| `SENTRY_DSN` | Sentry error tracking DSN (optional) | `""` |

### Frontend Environment Variables (`frontend/.env.local`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Django REST API Base URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Frontend site URL for canonicals & SEO | `http://localhost:3000` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend tracking (optional) | `""` |

---

## 🚀 Local Development Setup

### 1. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser for Django Admin
python manage.py createsuperuser

# Start Django Development Server
python manage.py runserver 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js Development Server
npm run dev
```

Visit `http://localhost:3000` in your browser. API docs available at `http://localhost:8000/api/docs/`.

---

## 🐳 Running with Docker Compose

### Local Development Containers
```bash
docker-compose up --build
```

### Production Stack
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🧪 Testing & Verification

```bash
# Run Backend Pytest Suite & Ruff Linter
ruff check .
pytest

# Run Frontend Build Check
cd frontend
npm run lint
npm run build
```
