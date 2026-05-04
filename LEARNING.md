# Microservices Learning Journey

A personal reference documenting the what, why, and how of building this microservices project with Node.js, Fastify, and TypeScript.

---

## Mind Map

```
Microservices Learning
│
├── 1. Foundation
│   ├── Monorepo (npm workspaces)
│   ├── TypeScript (strict, NodeNext modules)
│   └── Fastify (fast, plugin-based)
│
├── 2. Services
│   ├── user-service      → port 3001 (users CRUD)
│   ├── product-service   → port 3002 (products CRUD)
│   ├── order-service     → port 3003 (calls user + product)
│   └── api-gateway       → port 3000 (single entry point)
│
├── 3. Core Concepts
│   ├── Entry point flow (index.ts bootstraps)
│   ├── Plugin system (register + fastify-plugin)
│   ├── Encapsulation (child scopes vs parent)
│   ├── Inter-service HTTP (fetch, service URLs)
│   └── API Gateway pattern (client only knows 3000)
│
├── 4. Configuration
│   ├── @fastify/env + dotenv
│   ├── Schema validation for env vars
│   └── fastify-plugin to expose config globally
│
├── 5. Request Validation
│   ├── JSON Schema (built into Fastify)
│   ├── body, params, query validation
│   └── Automatic 400 on invalid requests
│
├── 6. Shared Types
│   ├── @microservices/shared package
│   ├── User, Product, Order interfaces
│   └── AppError class for consistent errors
│
├── 7. Error Handling
│   ├── Custom AppError class
│   ├── setErrorHandler globally
│   └── Consistent error response shape
│
├── 8. Docker
│   ├── Image = blueprint, Container = instance
│   ├── Dockerfile (layered build)
│   ├── docker-compose.yml (orchestration)
│   └── Service-name DNS (not localhost)
│
├── 9. Database (Postgres + Prisma 7)
│   ├── Database-per-service (one Postgres, multiple DBs)
│   ├── Prisma schema.prisma (generator + datasource + models)
│   ├── Migrations (npx prisma migrate dev --name <name>)
│   ├── PrismaClient with @prisma/adapter-pg (Prisma 7)
│   └── dotenv/config to load DATABASE_URL at import time
│
├── 10. Dev Workflow (Hybrid)
│   ├── Option A: Postgres in Docker, services local (npm run) ← chosen
│   ├── Option B: Everything in Docker (rebuild on every change)
│   ├── .env uses localhost (local dev)
│   └── docker-compose uses `postgres` hostname (when fully containerized)
│
├── 11. Authentication (JWT)
│   ├── bcrypt for password hashing (slow by design)
│   ├── @fastify/jwt for sign + verify
│   ├── POST /auth/register, POST /auth/login
│   ├── Stateless — token IS the session
│   ├── preHandler hook + fastify.decorate("authenticate")
│   ├── Same JWT_SECRET shared across all services
│   ├── Order-service forwards Authorization header on internal calls
│   └── Gateway forwards Authorization header automatically
│
└── 12. Message Queues (RabbitMQ + amqplib)
    ├── Pub/Sub via topic exchanges
    ├── Exchange = router, Queue = mailbox, Binding = rule
    ├── Publisher (order-service) fire-and-forget
    ├── Consumer (notification-service) — own queue per service
    ├── assertExchange / assertQueue = idempotent
    ├── Manual ack — message redelivered if consumer crashes
    └── Outbox pattern (dual-write problem) — known but not implemented
```

---

## Architecture

```
               Client
                 │
                 ▼
        API Gateway (3000)
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
 User (3001) Product (3002) Order (3003)
                              │
                              ├─► calls User
                              └─► calls Product
```

---

## Folder Structure

```
microservices/
├── package.json                      # Root workspace config
├── tsconfig.base.json                # Shared TS config
├── docker-compose.yml                # Orchestrates all containers
├── .dockerignore                     # Files Docker ignores
│
├── packages/
│   └── shared/                       # Shared types/classes
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts              # User, Product, Order, AppError
│
└── services/
    ├── user-service/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── .env                      # PORT, HOST, DATABASE_URL, JWT_SECRET
    │   ├── Dockerfile
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   ├── prisma.config.ts
    │   └── src/
    │       ├── index.ts              # Entry point
    │       ├── config.ts             # @fastify/env setup
    │       ├── lib/
    │       │   └── prisma.ts         # PrismaClient + driver adapter
    │       ├── plugins/
    │       │   ├── errorHandler.ts
    │       │   ├── jwt.ts            # @fastify/jwt registration
    │       │   └── authenticate.ts   # fastify.decorate("authenticate")
    │       ├── routes/
    │       │   ├── user.routes.ts    # URL + schema
    │       │   └── auth.routes.ts    # /register, /login
    │       ├── handlers/
    │       │   ├── user.handlers.ts  # Business logic
    │       │   └── auth.handlers.ts  # bcrypt + JWT
    │       └── types/
    │           └── fastify-jwt.d.ts  # payload shape
    │
    ├── product-service/              # same structure
    ├── order-service/                # same structure + service URLs in .env
    └── api-gateway/                  # uses @fastify/http-proxy
```

---

## Step-by-Step: What We Built and Why

### Step 1: Root `package.json` (npm workspaces)
- One repo, multiple packages
- Root `workspaces` field declares `packages/*` and `services/*`
- `npm install` from root installs everything into one shared `node_modules`

### Step 2: `tsconfig.base.json`
- Single source of TS config
- `module: NodeNext` + `moduleResolution: NodeNext` → requires `.js` extension in imports (even in `.ts` files)
- `strict: true` for type safety

### Step 3: Shared Package
- `@microservices/shared` — holds types/classes used by multiple services
- Must be built (`tsc`) before services can import it
- Services declare it as dependency with version `"*"` so workspaces links it

### Step 4-5: First Service (user-service)
- Entry point pattern: `src/index.ts` → create Fastify → register plugins → register routes → listen
- Separation: routes (URLs) vs handlers (logic) vs index (bootstrap)
- `tsx watch` runs TS directly with auto-restart

### Step 6-7: Inter-Service Communication
- Node 18+ has global `fetch` — no package needed
- order-service calls user-service and product-service via HTTP
- This is **the** core of microservices

### Step 8: Environment Variables
- `@fastify/env` loads `.env` and validates via JSON schema
- Service fails to start if required vars are missing — **fail fast**
- `fastify-plugin` is needed to expose `server.config` to the parent scope (else it's trapped in child scope)

### Step 9: API Gateway
- `@fastify/http-proxy` forwards requests by URL prefix
- Client only needs to know port 3000
- If an upstream is down, returns 502 automatically

### Step 10: Schema Validation
- Fastify validates body/params against JSON schema **before** handler runs
- Invalid requests → automatic 400 with descriptive message
- Faster than Zod because schemas are compiled once

### Step 11: Shared Types Across Services
- `User`, `Product`, `Order` defined once
- Imported via `@microservices/shared`
- Rebuild shared package whenever types change: `npm run build --workspace=packages/shared`

### Step 12: Error Handling
- `AppError` class (in shared) with `statusCode`
- `setErrorHandler` plugin formats all errors consistently
- Handlers `throw new AppError(...)` instead of manual reply.status

### Step 13: Docker
- **Image** (blueprint) vs **Container** (running instance)
- Dockerfile: FROM → WORKDIR → COPY → RUN → EXPOSE → CMD
- Docker Compose defines all services + networks in one YAML
- Inside Docker, services talk via service name (e.g., `http://user-service:3001`) — NOT `localhost`

### Step 14: Database Layer (Postgres + Prisma 7)
- Added `postgres:16-alpine` container; `init.sql` creates `user_db`, `product_db`, `order_db` on first start
- Each service has its own `prisma/schema.prisma` with its own `model`
- `npx prisma migrate dev --name <name>` generates + applies SQL migration
- Prisma 7 uses the new `@prisma/adapter-pg` (driver adapter pattern):
  ```ts
  import "dotenv/config"
  import { PrismaPg } from "@prisma/adapter-pg"
  import { PrismaClient } from "../generated/prisma/client.js"
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  export const prisma = new PrismaClient({ adapter })
  ```
- Prisma 7 also needs a `prisma.config.ts` at service root (CLI won't auto-detect):
  ```ts
  import "dotenv/config";
  import { defineConfig } from "prisma/config";
  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    datasource: { url: process.env["DATABASE_URL"] },
  });
  ```
- Schema uses the new generator: `provider = "prisma-client"`, `output = "../src/generated/prisma"`
- Handlers replaced in-memory arrays with `prisma.<model>.create/findUnique`
- Persistence verified — data survives service restarts

### Step 15: Dockerfile with Prisma + Migrations
- Dockerfile needs an extra step to generate the Prisma client at build time:
  ```dockerfile
  RUN npx prisma generate --schema=services/user-service/prisma/schema.prisma
  ```
- CMD runs migrations **before** starting the service (and `cd`s into the service dir so `prisma.config.ts` is found):
  ```dockerfile
  CMD cd services/user-service && npx prisma migrate deploy && cd /app && npm run dev --workspace=services/user-service
  ```
- `migrate deploy` (not `migrate dev`) is the prod-safe command — applies pending migrations, never prompts, never drops data

### Step 16: Hybrid Dev Workflow (What We Chose)
- **Problem**: Rebuilding Docker images on every code change is slow
- **Option A (chosen)**: Postgres runs in Docker (`docker compose up postgres`), services run locally via `npm run <service>`
  - `.env` uses `DATABASE_URL=postgresql://admin:admin@localhost:5432/...`
  - Fast iteration — `tsx watch` reloads on save
- **Option B**: Everything in Docker — needed only when testing the full containerized setup or deploying
  - `docker-compose.yml` overrides `DATABASE_URL` to use `postgres` hostname (service-name DNS)
- The `.env` file does NOT need to change between modes because docker-compose's `environment:` block overrides it inside containers

### Step 17: JWT Authentication (in user-service)
- **Decision**: Auth lives inside user-service (Option 1) instead of a separate auth-service. Avoids the data-ownership problem of "where does the User table live?"
- **Schema change**: added `password String?` to User model + migration `add_password`. Optional so existing users don't break.
- **Packages**: `@fastify/jwt` (sign/verify), `bcrypt` (hash/compare), `@types/bcrypt`
- **Env**: added `JWT_SECRET` to `.env` and to the env schema in `config.ts` so startup fails fast if missing
- **Plugin pattern**: wrapped `fastify-jwt` registration with `fp()` so `fastify.jwt` is visible in the parent scope (same trick as config)
- **Type augmentation** at `src/types/fastify-jwt.d.ts` declares the JWT payload shape:
  ```ts
  declare module "@fastify/jwt" {
    interface FastifyJWT {
      payload: { id: string; email: string };
      user: { id: string; email: string };
    }
  }
  ```
- **`authenticate` decorator**: a reusable preHandler that calls `request.jwtVerify()` and returns 401 on failure. Routes opt in via `preHandler: [fastify.authenticate]`.
- **Register flow**: `bcrypt.hash(password, 10)` → `prisma.user.create` → respond with `{id, name, email}` (never the password hash)
- **Login flow**: `findUnique({email})` → `bcrypt.compare(password, user.password)` → `reply.jwtSign({id, email}, {expiresIn: "1h"})` → respond with `{token}`
- **Security note**: same `"Invalid credentials"` 401 for both "user not found" and "wrong password" — prevents user enumeration
- **Gateway**: `@fastify/http-proxy` forwards all headers by default, so `Authorization: Bearer <token>` flows through `localhost:3000/users/...` → user-service unchanged

### Step 18: JWT Auth Across All Services
- Same `JWT_SECRET` in every service's `.env` — every service can verify tokens independently
- Each service has its own `plugins/jwt.ts`, `plugins/authenticate.ts`, and `types/fastify-jwt.d.ts`
- `authenticate` decorator must be type-augmented in `config.ts` (or a `.d.ts` file):
  ```ts
  declare module 'fastify' {
    interface FastifyInstance {
      authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    }
  }
  ```
- Order-service forwards the inbound `Authorization` header to user-service and product-service:
  ```ts
  const authHeader = request.headers.authorization
  await fetch(url, { headers: authHeader ? { Authorization: authHeader } : {} })
  ```
- This is the **shared-secret pattern** — every service trusts a token if its signature checks out, no central auth call needed
- Real systems often upgrade to **RS256** (private/public keypair) so only auth-service holds the signing key, others verify with the public key

### Step 19: Message Queues with RabbitMQ
- Added `rabbitmq:4-management-alpine` to docker-compose (ports 5672 AMQP + 15672 management UI)
- Three RabbitMQ concepts:
  - **Exchange** = router (decides where messages go)
  - **Queue** = mailbox (stores messages until consumed)
  - **Binding** = rule connecting exchange → queue (with a routing key pattern)
- `topic` exchange type — routing keys can be patterns like `order.*` or `#`
- **Publisher side** (order-service):
  ```ts
  channel.publish("orders", "order.created", Buffer.from(JSON.stringify(event)), { persistent: true })
  ```
- **Consumer side** (notification-service — a non-Fastify Node script):
  ```ts
  await channel.assertQueue("notification.order.created", { durable: true })
  await channel.bindQueue("notification.order.created", "orders", "order.created")
  channel.consume("notification.order.created", (msg) => { ... channel.ack(msg) })
  ```
- Queue naming convention: `<consumer-name>.<event-name>` — each consumer owns a queue, exchange duplicates messages into all bound queues
- **Manual ack**: messages stay in the queue until `channel.ack(msg)`. If consumer crashes, message is redelivered.
- **`{ persistent: true }`** + **`{ durable: true }`** = messages survive broker restart
- **Decoupling proof**: stop the consumer, publish events → they queue up; restart consumer → it catches up

### Step 20: The Outbox Pattern (concept only)
- **Dual-write problem**: writing to DB and publishing to broker are 2 separate systems — can't be atomic
- If RabbitMQ is down between DB write and publish, the event is lost forever
- **Outbox pattern**: insert event into an `outbox` table in the **same DB transaction** as the order. A separate worker polls the outbox and publishes to RabbitMQ. Marks rows as published.
- Guarantees **at-least-once** delivery
- Variant: **Change Data Capture (CDC)** with Debezium — read the DB's WAL directly
- Not implemented in this project, but the standard production fix

### Step 21: API Gateway Prefix Insight
- The gateway does `httpProxy({ upstream: PRODUCT_SERVICE_URL, prefix: '/products' })`
- This means `POST http://localhost:3000/products` → forwards to `http://product-service:3002/` (prefix is stripped)
- So the service-internal route should be `/`, not `/products` (otherwise you'd need `/products/products` through the gateway)
- **Rule of thumb**: inside the service, write routes **without** the gateway prefix

---

## Key Mental Models

### Fastify Plugin System
```
server
  └── register(plugin)  ← queued, not executed yet
  └── register(plugin)  ← queued
  └── listen()          ← NOW all plugins execute
```
- Plugins run lazily when `listen()` / `ready()` is called
- `server.register()` creates a **child scope** (encapsulation)
- Use `fp(plugin)` when you want decorations visible in the **parent**

### Monorepo with Workspaces
```
root/node_modules   ← ONE place for all deps
  ├── fastify
  ├── tsx
  └── @microservices/shared  ← symlinked to ../packages/shared
```

### Docker Networking
```
Before Docker:  localhost:3001  (same machine)
Inside Docker:  http://user-service:3001  (DNS by service name)
```

---

## Common Commands

```bash
# Run individual services (dev)
npm run user-service
npm run product-service
npm run order-service
npm run api-gateway

# Build shared package (run after editing shared types)
npm run build --workspace=packages/shared

# Docker
docker compose up              # start all
docker compose up -d           # detached
docker compose down            # stop + remove
docker compose build           # rebuild images
docker compose logs -f user-service   # follow logs

# Build individual image
docker build -f services/user-service/Dockerfile -t user-service:latest .
```

---

## Gotchas We Hit (and Lessons Learned)

| Problem | Cause | Fix |
|---|---|---|
| Server silently exits, no error | `start()` function defined but never called | Call `start()` at the bottom |
| `fetch` missing "undici" package | In Node 18+, `fetch` is global | No import needed |
| `server.config` is undefined | Fastify encapsulation | Wrap plugin with `fp()` from `fastify-plugin` |
| `PORT` is NaN | Using `process.env.PORT` before plugins run | Use `server.config.PORT` inside `listen()` call |
| Port already in use | Previous process still listening | Kill it via `taskkill` / Stop-Process |
| `ENOTFOUND localhost"` | Typo — extra quote in URL | Small mistakes = big failures |
| `PrismaClient needs valid options` | Prisma 7 requires explicit config | Use driver adapter: `new PrismaClient({ adapter })` |
| `SASL: password must be a string` | `DATABASE_URL` not loaded when prisma.ts ran | Add `import "dotenv/config"` at the top of prisma.ts |
| `datasource.url required` (in Docker) | Prisma CLI ran from `/app`, couldn't find `prisma.config.ts` at `services/<name>/` | `cd services/<name>` first, then run `migrate deploy` |
| `postgres` service not starting in compose | Block placed at top level instead of under `services:` | Indent it inside `services:` block |
| Route `/products/products` through gateway | Service had `/products` and gateway prefix was also `/products` | Inside the service, use `/` — gateway strips the prefix |
| Rebuilding Docker on every code change | Running full stack in Docker for dev | Use hybrid: Postgres in Docker, services local |
| `request.body` is `unknown` in TS | Used `FastifyReply<{Body: ...}>` instead of `FastifyRequest<{Body: ...}>` | Generic goes on `FastifyRequest`, not `FastifyReply` |
| Login returns 200 with empty body | Forgot `return reply.send({ token })` after `jwtSign` | A handler returning nothing → Fastify sends empty 200 |
| Prisma TS error after schema change | Client wasn't regenerated | `npx prisma generate` (migrate dev usually does this automatically) |
| `Property 'authenticate' does not exist on type 'FastifyInstance'` | Decorator added at runtime, but TS doesn't know | Augment `FastifyInstance` in `declare module 'fastify'` |
| Consumer running but no messages received | Queue declared but never bound to exchange | `channel.bindQueue(queueName, exchange, routingKey)` |
| Messages disappearing | Forgot `channel.ack(msg)` — they go to "unacked" then redeliver forever | Always ack after successful processing |
| Service-in-Docker can't reach RabbitMQ | Used `localhost:5672` from inside a container | Use service-name DNS: `amqp://...@rabbitmq:5672` |

---

## What's Next (For Later)

1. ~~**Database layer** — Postgres + Prisma. Replace in-memory arrays.~~ ✅ Done (Prisma 7 + driver adapter)
2. ~~**Docker** — containerize all services + orchestrate with compose.~~ ✅ Done
3. ~~**Authentication** — JWT + `@fastify/jwt`. Protect routes.~~ ✅ Done (across all services)
4. ~~**Apply auth across services** — protect product/order routes; share JWT_SECRET; forward header.~~ ✅ Done
5. ~~**Message queues** — RabbitMQ + amqplib. Pub/Sub via topic exchanges.~~ ✅ Done
6. **Testing** — Vitest + supertest per service. ⬅ **next candidate**
7. **Outbox pattern** — guaranteed event delivery (atomic DB+event write).
8. **Logging/observability** — Centralized logs (pino + Loki/ELK) and metrics (Prometheus).
9. **CI/CD** — GitHub Actions to build/test/push images.
10. **Service discovery** — replace hardcoded service URLs with discovery (Consul/etcd) when scaling out.

---

## Quick Recall: Pub/Sub Event Flow

```
   ┌────────────────┐
   │ order-service  │  POST /orders (creates order in DB)
   │  (publisher)   │
   └────────┬───────┘
            │
            │  channel.publish("orders", "order.created", buffer)
            ▼
   ┌────────────────────────────┐
   │ EXCHANGE: orders (topic)   │   ← idempotent: assertExchange()
   └────────────┬───────────────┘
                │
        binding: routing key "order.created"
                │
   ┌────────────┴───────────────┐
   ▼                            ▼
┌──────────────────────┐   ┌──────────────────────┐
│ notification.order.  │   │ analytics.order.     │  (future)
│ created              │   │ created              │
│ (queue)              │   │ (queue)              │
└──────────┬───────────┘   └──────────┬───────────┘
           │                          │
           ▼                          ▼
   ┌────────────────┐         ┌────────────────┐
   │ notification-  │         │ analytics-     │
   │ service        │         │ service        │
   │ (consumer)     │         │ (consumer)     │
   └────────────────┘         └────────────────┘
```

**Key insight**: order-service has no idea who's listening. Adding a new subscriber means creating a new queue + binding — no code change in the publisher. That's the decoupling pub/sub gives you.

---

## Quick Recall: JWT Auth Flow

```
1. Register
   POST /auth/register {name, email, password}
        │
        ▼
   bcrypt.hash(password, 10)  ─────►  hashed
        │
        ▼
   prisma.user.create({ name, email, password: hashed })
        │
        ▼
   201 { id, name, email }   (NEVER return password)


2. Login
   POST /auth/login {email, password}
        │
        ▼
   prisma.user.findUnique({ email })
        │
        ▼
   bcrypt.compare(password, user.password)  ─►  true / false
        │ (true)
        ▼
   reply.jwtSign({ id, email }, { expiresIn: "1h" })
        │
        ▼
   200 { token: "eyJhbGc...header.payload.signature" }


3. Protected request
   GET /users/:id
   Authorization: Bearer eyJhbGc...
        │
        ▼
   preHandler: fastify.authenticate
        │
        ▼
   request.jwtVerify()   ─►  fails → 401 Unauthorized
        │ (passes)
        ▼
   request.user = { id, email }   (decoded payload)
        │
        ▼
   handler runs → returns user
```

**Key insight**: the server keeps no session. The token IS the session. Any service with the same `JWT_SECRET` can verify a token without calling user-service.

---

## Quick Recall: The Flow of a Request

```
POST /orders (client → port 3000)
   │
   ▼
api-gateway          (@fastify/http-proxy forwards by prefix)
   │
   ▼
order-service        (validates body via schema)
   │
   ├──► fetch http://user-service:3001/users/:id
   │       └── returns user object
   │
   ├──► fetch http://product-service:3002/products/:id
   │       └── returns product object
   │
   ▼
Combine data → create order → push to orders[] → respond 201
```

This is microservices in a nutshell.
