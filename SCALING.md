# Architectural Scaling Roadmap (`SCALING.md`)

This document provides technical guidance and architectural strategies for scaling the **Rastogi cartridges** e-commerce platform from low initial traffic to millions of active daily users without requiring a total codebase rewrite.

---

## 1. Database Scaling: Connection Pooling & Read Replicas

### Current State
PostgreSQL 16 single instance handling read/write queries via Django ORM.

### Next Milestones
1. **PgBouncer Connection Pooling**:
   - Deploy `PgBouncer` in front of PostgreSQL to manage pooled database connections efficiently and prevent `max_connections` exhaustion during high concurrency checkout bursts.
2. **Read Replicas**:
   - Use Django's `DATABASE_ROUTERS` to route catalog, product, and compatibility read queries to read replicas while directing writes (orders, inventory locks, user creation) to the primary PostgreSQL writer.
   - Configure PostgreSQL streaming replication with failover using Patroni or AWS Aurora / GCP Cloud SQL replicas.

---

## 2. Search Optimization: Swap-In Meilisearch or Typesense

### Current State
PostgreSQL `icontains` and Django Filter backend queries.

### Next Milestones
1. **Dedicated Search Engine**:
   - Swap search engine with **Meilisearch** or **Typesense** for instant sub-50ms fuzzy search.
   - Index catalog items, product variants, printer brands, and host device models into searchable indexes.
2. **Asynchronous Index Syncing**:
   - Use Django Signals (`post_save`, `post_delete`) and Celery background tasks to push catalog and compatibility updates to Meilisearch asynchronously without blocking HTTP requests.

---

## 3. Worker & Application Tier Scaling

### Current State
Django Gunicorn application container + single Celery worker & beat container.

### Next Milestones
1. **Horizontal Django Pod Scaling**:
   - Scale Django Gunicorn instances horizontally behind a load balancer (Nginx / AWS ALB / Traefik) since state is stateless (JWT auth + Redis session cache).
2. **Celery Task Queue Segregation**:
   - Separate Celery workers into dedicated queues based on priority:
     - `high_priority`: Order processing and inventory reserve/restore tasks.
     - `emails`: Asynchronous customer order receipts and contact notifications.
     - `background`: Daily low-stock inspection tasks and low-priority cache pre-warming.

---

## 4. Edge Caching & CDN Strategy

### Current State
Next.js ISR (`revalidate = 60`) on Node.js server.

### Next Milestones
1. **Cloudflare / AWS CloudFront Edge Caching**:
   - Cache Next.js static pages (`/`, `/category/*`, `/product/*`, `/compatibility/*`) at the edge using `stale-while-revalidate` HTTP headers.
2. **Media Asset Offloading**:
   - Serve product images and brand logos directly from S3/Cloudflare R2 through Cloudflare Images / AWS CloudFront with webp auto-conversion.

---

## 5. Microservices Decomposition Triggers

### Current State
Clean modular monolith with decoupled apps (`users`, `catalog`, `compatibility`, `inventory`, `cart`, `orders`, `payments`, `reviews`, `promotions`).

### When to Decompose:
- **Compatibility Microservice**:
  - *Trigger*: When external partner APIs or retail B2B integrations query printer model fit data at 10,000+ requests/sec.
  - *Action*: Extract `apps/compatibility/` into a dedicated Go or Rust gRPC service powered by Redis graph caching.
- **Inventory & Stock Locking Service**:
  - *Trigger*: When flash sales cause heavy DB row-lock contention on `StockRecord`.
  - *Action*: Extract inventory reservation logic into an in-memory Redis Lua script / distributed lock service (Redlock).
