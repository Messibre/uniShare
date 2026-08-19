#  uniShare - Campus Rental System

> **A full‑stack web application for students to browse, list, and rent academic and everyday campus gear. Built with modern 2026 standards – authentication, payments, digital identity, and automated deployment.**

---

## 📋 Overview

uniShare is a peer-to-peer and platform-owned rental platform designed for university students. Students can:

- Browse and rent items from platform inventory and fellow students
- List their own items when not in use (becoming an "owner")
- Verify identity via Ethiopian National ID (Fayda)
- Pay securely via Chapa payment gateway
- Track rental history in real-time
- Manage rentals as both renter and owner

**Core business logic**: Items come from two sources – platform-owned inventory (admin stocks calculators, cameras) and peer-listed items (students list their own gear). Renting requires identity verification (Ethiopian national ID / Fayda) for real accountability. Every rental has a tracked history: `REQUESTED → CONFIRMED → ACTIVE → RETURNED/OVERDUE`.

---

## 🚀 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) + React | 15.5.x / 19.x |
| **Language** | TypeScript | 5.x |
| **Database** | Supabase (PostgreSQL) | 15.x |
| **ORM** | Prisma | 7.x |
| **Authentication** | JWT (httpOnly cookies) + bcrypt | - |
| **Payments** | Chapa v1 | - |
| **Identity** | Fayda eSignet (OIDC / Sandbox) | - |
| **Styling** | Tailwind CSS + shadcn/ui | 3.x / latest |
| **Testing** | Vitest + React Testing Library | 2.x / 16.x |
| **CI/CD** | GitHub Actions → Vercel | - |

---

## 🏗️ Project Architecture

Since the backend is inside Next.js, the architecture follows a **monolithic approach**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Middleware (Edge Runtime)                       │
│  - Verifies JWT signature (cryptographic, NO database)            │
│  - Attaches x-user-id / x-user-role to request headers            │
│  - Excludes public routes: /api/auth/*, GET /api/items           │
│  - Redirects unauthenticated users to /login                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────────────────┐
          │   Pages Layer   │         │     API Routes Layer         │
          │   (Server/      │         │     (Node.js Runtime)        │
          │    Components)  │         │                             │
          └─────────────────┘         └─────────────────────────────┘
                    │                           │
                    ▼                           ▼
          ┌─────────────────────────────────────────────────────────────┐
          │                         Route Guards                      │
          │  - requireAuth() – checks DB user exists & is verified    │
          │  - requireAdmin() – checks DB role is ADMIN               │
          │  - getUserId() – lightweight header check (NO DB)         │
          └─────────────────────────────────────────────────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌─────────────────────────────────────────────────────┐
                    │              Database (Supabase)                   │
                    │  - PostgreSQL 15                                   │
                    │  - Schema: uniShare                               │
                    │  - 12 models with relations                       │
                    └─────────────────────────────────────────────────────┘
```

### Security Layers (Defense in Depth)

| Layer | What it checks | Runs On | DB Calls |
|-------|----------------|---------|----------|
| **Middleware** | JWT signature (cryptographic) | Edge Runtime | ❌ 0 |
| **Route Handler** | User exists in DB (when needed) | Node.js | ✅ 1-2 |
| **Business Logic** | Ownership, verification status, availability | Node.js | ✅ 1-3 |

**The rule**: Trust the JWT for speed, verify with DB for safety. `GET` requests use headers (fast), `POST/PATCH/DELETE` use `requireAuth()` (fresh data).

---

## 📁 Complete Project Structure

```
uniShare/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          # POST – Login, set cookies
│   │   │   ├── register/route.ts       # POST – Register new user
│   │   │   ├── logout/route.ts         # POST – Logout, revoke token
│   │   │   ├── refresh/route.ts        # POST – Refresh access token
│   │   │   └── me/route.ts             # GET – Get current user
│   │   ├── items/
│   │   │   ├── route.ts                # GET (public) + POST (protected)
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET (public), PATCH, DELETE (protected)
│   │   ├── rentals/
│   │   │   ├── route.ts                # GET (list) + POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET (detail) + DELETE (soft)
│   │   │       └── status/route.ts     # PATCH – Status transitions
│   │   └── payments/
│   │       ├── initialize/route.ts     # POST – Create Chapa session
│   │       ├── webhook/route.ts        # POST – Chapa webhook handler
│   │       └── callback/route.ts       # GET – Redirect fallback (UX only)
│   ├── dashboard/
│   │   └── page.tsx                    # Renter + Owner views (predicted)
│   ├── login/
│   │   └── page.tsx                    # Login form (predicted)
│   ├── register/
│   │   └── page.tsx                    # Register form (predicted)
│   ├── items/
│   │   ├── page.tsx                    # Browse items (predicted)
│   │   └── [id]/
│   │       └── page.tsx                # Item detail + rent (predicted)
│   ├── layout.tsx                      # Root layout
│   ├── globals.css                     # Tailwind + shadcn/ui
│   └── page.tsx                        # Homepage (redirects to dashboard)
├── lib/
│   ├── prisma.ts                       # Prisma client (singleton)
│   ├── auth.ts                         # JWT sign/verify (Node.js)
│   ├── auth-edge.ts                    # JWT verify (Edge – uses jose)
│   ├── auth-guard.ts                   # requireAuth, requireAdmin, getUserId
│   ├── bcrypt.ts                       # Password hash + compare
│   ├── chapa.ts                        # Chapa v1 client (init, verify)
│   ├── email.ts                        # Email service (Resend)
│   ├── payment-utils.ts                # confirmRental(), handleSuccess()
│   └── validations.ts                  # Zod schemas (auth, items, rentals, payments)
├── prisma/
│   ├── schema.prisma                   # Database models + enums
│   ├── migrations/                     # Migration history
│   └── seed.ts                         # Seed script (users, items, rentals)
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts                # JWT + bcrypt helpers
│   │   ├── validations.test.ts         # Zod schemas
│   │   └── auth-guard.test.ts          # requireAuth, requireAdmin (mocked)
│   ├── integration/
│   │   ├── auth/
│   │   │   ├── register.test.ts        # POST /api/auth/register
│   │   │   ├── login.test.ts           # POST /api/auth/login
│   │   │   ├── refresh.test.ts         # POST /api/auth/refresh
│   │   │   └── logout.test.ts          # POST /api/auth/logout
│   │   ├── items/
│   │   │   ├── get-items.test.ts       # GET /api/items (public)
│   │   │   ├── create-item.test.ts     # POST /api/items (protected)
│   │   │   ├── update-item.test.ts     # PATCH /api/items/[id]
│   │   │   └── delete-item.test.ts     # DELETE /api/items/[id]
│   │   ├── rentals/
│   │   │   ├── create-rental.test.ts   # POST /api/rentals (overlap checks)
│   │   │   ├── get-rentals.test.ts     # GET /api/rentals (filtering)
│   │   │   ├── update-status.test.ts   # PATCH /api/rentals/[id]/status
│   │   │   └── delete-rental.test.ts   # DELETE /api/rentals/[id] (soft)
│   │   └── payments/
│   │       ├── initialize.test.ts      # POST /api/payments/initialize
│   │       └── webhook.test.ts         # POST /api/payments/webhook
│   ├── fixtures/
│   │   └── data.ts                     # Test data (users, items, rentals)
│   └── setup/
│       └── setup.ts                    # Prisma mock + global setup
├── components/
│   └── ui/                             # shadcn/ui components (Button, Card, etc.)
├── public/                             # Static assets
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions (build + test)
├── middleware.ts                       # Edge middleware (JWT verification)
├── next.config.ts                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind configuration
├── vitest.config.ts                    # Vitest configuration
├── prisma.config.ts                    # Prisma 7 configuration
├── package.json                        # Dependencies + scripts
├── .env.example                        # Environment variables template
├── .env.local                          # Your local env vars (gitignored)
├── .gitignore                          # Git ignore rules
├── tsconfig.json                       # TypeScript configuration
├── postcss.config.mjs                  # PostCSS configuration
├── eslint.config.mjs                   # ESLint 9 (flat config)
├── components.json                     # shadcn/ui configuration
└── README.md                           # You are here
```

---

## 🗄️ Database Schema (Prisma)

### Enums

| Enum | Values |
|------|--------|
| `Role` | `STUDENT`, `ADMIN` |
| `OwnerType` | `PLATFORM`, `EndUser` |
| `ItemStatus` | `AVAILABLE`, `RENTED`, `MAINTENANCE`, `REMOVED` |
| `RentalStatus` | `PENDING`, `CONFIRMED`, `ACTIVE`, `RETURNED`, `OVERDUE`, `CANCELLED` |
| `PaymentType` | `RENTAL_FEE`, `DEPOSIT`, `REFUND` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` |

### Models

| Model | Purpose | Key Relations |
|-------|---------|---------------|
| `EndUser` | Users (students + admins) | Has many `Item`, `Rental`, `Payment`, `RefreshToken`, `IdentityVerification` |
| `RefreshToken` | Stored refresh tokens (revocable) | Belongs to `EndUser` |
| `Item` | Items for rent | Belongs to `EndUser` (owner), has many `Rental` |
| `Rental` | Rental transactions | Belongs to `Item`, `EndUser` (renter + owner), has many `RentalStatusLog`, `Payment` |
| `RentalStatusLog` | History timeline | Belongs to `Rental` |
| `Payment` | Payment records | Belongs to `Rental`, `EndUser` |
| `IdentityVerification` | Fayda verification records | Belongs to `EndUser` |

---

## 🔐 Authentication Flow

### JWT Architecture

| Token | Duration | Purpose | Storage |
|-------|----------|---------|---------|
| **Access Token** | 15 minutes | Authorize API requests | httpOnly cookie |
| **Refresh Token** | 7 days | Issue new access tokens | httpOnly cookie + DB |

### Endpoints

| Method | Route | Public? | Description |
|--------|-------|---------|-------------|
| `POST` | `/api/auth/register` | ✅ Yes | Create account, set cookies |
| `POST` | `/api/auth/login` | ✅ Yes | Login, set cookies |
| `POST` | `/api/auth/logout` | ❌ No | Logout, revoke refresh token, clear cookies |
| `POST` | `/api/auth/refresh` | ❌ No | Refresh access token |
| `GET` | `/api/auth/me` | ❌ No | Get current user |

### Security Features

- **httpOnly cookies** – Prevents XSS token theft
- **sameSite: "lax"** – Protects against CSRF
- **secure: true** – HTTPS only in production
- **bcrypt** – Password hashing (12 rounds)
- **Refresh token rotation** – Revokes old tokens on new login
- **JWT signing** – Separate secrets for access/refresh tokens

---

## 📦 Item Management API

| Method | Route | Public? | Description |
|--------|-------|---------|-------------|
| `GET` | `/api/items` | ✅ Yes | Browse with filters (search, category, price, availability) |
| `GET` | `/api/items/[id]` | ✅ Yes | Get single item with owner + rental history |
| `POST` | `/api/items` | ❌ No | List new item (requires `isIdVerified: true`) |
| `PATCH` | `/api/items/[id]` | ❌ No | Update item (owner or admin only) |
| `DELETE` | `/api/items/[id]` | ❌ No | Soft delete (owner or admin only) |

**Filters**: `?search=...&category=...&minPrice=...&maxPrice=...&available=true`

---

## 📋 Rental Flow API

### Lifecycle

```
PENDING (requested)
    ↓ (owner confirms + payment)
CONFIRMED
    ↓ (owner marks as picked up)
ACTIVE
    ↓ (renter returns item)
RETURNED
    ↓ (deposit refunded)
OVERDUE (if endDate passed and not returned)
CANCELLED (if renter cancels before confirmation)
```

### Endpoints

| Method | Route | Public? | Description |
|--------|-------|---------|-------------|
| `POST` | `/api/rentals` | ❌ No | Request rental (checks availability + overlap) |
| `GET` | `/api/rentals` | ❌ No | List user's rentals (renter + owner) with filters |
| `GET` | `/api/rentals/[id]` | ❌ No | Get rental details + history timeline |
| `PATCH` | `/api/rentals/[id]/status` | ❌ No | Transition status (owner/admin/renter) |
| `DELETE` | `/api/rentals/[id]` | ❌ No | Soft delete (admin only) |

**Filters**: `?status=...&startDate=...&endDate=...&category=...&page=1&limit=10&sortBy=createdAt&sortOrder=desc`

**Status Transitions**:

| From | To | Who can do it |
|------|-----|---------------|
| `PENDING` | `CONFIRMED` | Owner (after payment) |
| `PENDING` | `CANCELLED` | Renter or Owner |
| `CONFIRMED` | `ACTIVE` | Owner |
| `ACTIVE` | `RETURNED` | Owner or Admin |
| `ACTIVE` | `OVERDUE` | System |
| `*` | `CANCELLED` | Admin (dispute resolution) |

---

## 💳 Payment Integration (Chapa v1)

### Flow

```
1. User requests rental → PENDING
2. User clicks "Pay" → POST /api/payments/initialize
3. Backend creates Payment record → PENDING
4. Backend calls Chapa v1 API → checkout_url
5. User redirected to Chapa hosted page
6. User pays with card/Telebirr
7. Chapa sends webhook to /api/payments/webhook
8. Backend VERIFIES with Chapa (server-side) → MUST check amount/currency
9. Backend updates Payment → SUCCESS
10. Backend updates Rental → CONFIRMED
11. Backend updates Item → RENTED
12. Backend sends confirmation email
13. User receives email + dashboard updates
```

### Endpoints

| Method | Route | Public? | Description |
|--------|-------|---------|-------------|
| `POST` | `/api/payments/initialize` | ❌ No | Create Chapa session, return `checkout_url` |
| `POST` | `/api/payments/webhook` | ✅ Yes | Chapa webhook handler (with verification) |
| `GET` | `/api/payments/callback` | ✅ Yes | Redirect fallback (UX only – shows "Processing") |

### Security Features

- **Idempotency Key** – Prevents duplicate charges
- **Server-side verification** – Never trust webhook payload alone
- **Amount/currency validation** – Blocks fraud (checks against expected)
- **Deduplication** – Handles at-least-once delivery safely
- **State progression** – Only moves `PENDING → SUCCESS`, never backwards

---

## 🧪 Testing Strategy

### Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit + integration tests (fast, Jest-compatible) |
| **React Testing Library** | Component tests |
| **Supertest** | API endpoint testing |
| **Mocked Prisma** | Database isolation |

### Test Coverage

| Area | What's Tested |
|------|---------------|
| **Auth Helpers** | JWT sign/verify, bcrypt hash/compare |
| **Validation Schemas** | Zod schemas (register, login, item, rental, payment) |
| **Auth Guards** | `requireAuth`, `requireAdmin`, `getUserId` |
| **Auth Endpoints** | Register, login, logout, refresh, `/me` |
| **Item Endpoints** | GET (public), POST (protected), PATCH, DELETE |
| **Rental Endpoints** | Create (overlap checks), list (filters), status transitions, soft delete |
| **Payment Endpoints** | Initialize (idempotency), webhook (verification, deduplication) |

### Running Tests

```bash
npm test
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
```

---

## 🖥️ Frontend (Predicted Structure)

### Pages (Routing)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Homepage | Redirects to `/dashboard` or `/login` |
| `/login` | Login | Email + password form (with redirect param) |
| `/register` | Register | Full name, email, password, phone form |
| `/dashboard` | Dashboard | Renter + Owner tabs with rentals, status, actions |
| `/items` | Browse Items | Grid/list with filters (search, category, price) |
| `/items/[id]` | Item Detail | Description, owner, availability, rent button |
| `/items/create` | Create Item | Form to list new item (name, description, category, price, deposit, image) |
| `/profile` | Profile | User info, ID verification status, logout |
| `/rentals/[id]` | Rental Detail | Full history timeline, payment info, actions |

### Components

| Component | Purpose |
|-----------|---------|
| `AuthForm` | Reusable login/register form |
| `ItemCard` | Display item in grid/list |
| `ItemFilters` | Search, category, price range |
| `RentalCard` | Display rental in dashboard |
| `RentalTimeline` | Status log history (stepper/timeline) |
| `PaymentButton` | Initiate payment (redirects to Chapa) |
| `StatusBadge` | Colored badge for rental/item status |
| `Navigation` | Navbar with auth state (login/dashboard) |

### State Management

| Approach | Purpose |
|----------|---------|
| **React Context** | User session, auth state |
| **Server Components** | Data fetching (rentals, items) |
| **Client Components** | Forms, interactivity, polling |

### Styling

- **Tailwind CSS** – Utility-first styling
- **shadcn/ui** – Accessible components (Button, Card, Tabs, Badge, Table, Dialog, Form)
- **Dark mode** – CSS variables (toggle support)

---

## 🌐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres...` |
| `JWT_ACCESS_SECRET` | Secret for access tokens (15min) | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (7 days) | `openssl rand -base64 32` |
| `CHAPA_SECRET_KEY` | Chapa v1 test/live key | `CHASECK_TEST_...` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `EMAIL_FROM` | Sender email address | `noreply@unishare.com` |
| `APP_BASE_URL` | Base URL of the app | `http://localhost:3000` (dev) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FAYDA_CLIENT_ID` | Fayda OIDC client ID (sandbox) | - |
| `FAYDA_CLIENT_SECRET` | Fayda OIDC client secret | - |
| `FAYDA_REDIRECT_URI` | Fayda callback URL | `http://localhost:3000/api/verify/callback` |

---

## 🚀 Deployment (Vercel + GitHub Actions)

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma generate
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Vercel Deployment

1. **Connect GitHub repo** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Preview deployments** on every PR
4. **Production deployment** on merge to `main`
5. **Automatic HTTPS** (Vercel handles SSL)

---

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description | Example |
|------|-------------|---------|
| `feat:` | New feature | `feat: add item CRUD endpoints` |
| `fix:` | Bug fix | `fix: correct JWT refresh rotation` |
| `chore:` | Maintenance | `chore: update dependencies` |
| `docs:` | Documentation | `docs: update README with API routes` |
| `test:` | Tests | `test: add unit tests for auth helpers` |
| `refactor:` | Code refactor | `refactor: extract Chapa client to lib/chapa.ts` |

---

## 📄 License

MIT

---

**Built with ❤️ by Messi**

---

## 🔗 Quick Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Chapa Docs](https://docs.chapa.co)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/docs)
- [Vitest Docs](https://vitest.dev/guide)