# UniShare — Vitest Test Suite

This adds a full Vitest suite covering every `lib/` module and every `app/api/**/route.ts`
handler, plus the config needed to run it. **272 tests, all passing** (verified in a clean
`npm install` + `npx vitest run`).

## What was added

- `package.json` (scripts + deps), `tsconfig.json`, `vitest.config.ts`
- `test/setup.ts` — env vars the app reads at import time (JWT secrets, Chapa key, etc.)
- `test/helpers.ts` — `makeRequest()` builds a real `NextRequest` (cookies, query params,
  JSON body); `ctx()` wraps dynamic-route `{ id }` params the way Next expects them
- `lib/__mocks__/prisma.ts` — manual mock, auto-used by `vi.mock("@/lib/prisma")`
- One `*.test.ts` next to every source file (22 total)

## Running it

```bash
npm install
npm test            # vitest run
npm run test:watch  # watch mode
npm run test:coverage
```

## Coverage by file

**lib/**
- `utils.test.ts` — `cn()`: falsy filtering, tailwind conflict resolution, arrays/objects
- `validations.test.ts` — every zod schema, boundary values (min lengths, positive-price,
  enum case-sensitivity, ISO datetime strictness, nested object validation)
- `bcrypt.test.ts` — real bcrypt hashing/comparison, salting, malformed-hash handling
- `auth.test.ts` — JWT sign/verify round-trips, wrong-secret rejection, expiry, cookie
  attributes (httpOnly, maxAge, clearing)
- `auth-edge.test.ts` — same coverage for the `jose`-based edge runtime variant
- `auth-guard.test.ts` — `getCurrentUser`/`requireAuth`/`requireAdmin`: missing cookie,
  invalid token, deleted user, DB failure swallowing, role gating
- `chapa.test.ts` — Chapa init/verify against a mocked `fetch`: success, API-level failure
  with/without message, network failure, malformed JSON, amount/currency validation
  including float-string parsing edge cases
- `payment-utils.test.ts` — rental confirmation side effects, payment idempotency
  (already-SUCCESS short-circuit), error propagation
- `email.test.ts` — dev-mode no-op vs. production send, error propagation, conditional
  HTML fragments (reason paragraph)

**app/api/** (mocking `prisma`, `auth-guard`, `chapa`, `email`, `payment-utils` as needed)
- `auth/{login,register,logout,me,refresh}` — validation failures, wrong credentials
  (constant-message check for login), token rotation/revocation, cookie assertions,
  500 handling
- `items` + `items/[id]` — search/filter query building, auth + ID-verification gates,
  ownership/admin authorization, soft-delete behavior
- `rentals` + `rentals/[id]` + `rentals/[id]/status` — the big one: date-range overlap
  logic, self-rental blocking, price calculation, pagination clamping, the full
  status-transition state machine (parameterized `it.each` over every invalid edge),
  renter-can-only-cancel restriction, item status side effects on each transition
- `payments/{initialize,callback,webhook}` — double-payment prevention (409), Chapa
  verification mismatch, webhook idempotency, "always return 200" webhook error handling
  (documents *why*: so Chapa doesn't retry-storm on transient errors), and a test that
  documents the callback route's unescaped `tx_ref` HTML interpolation (worth a look —
  see note below)

## Known gaps / things worth your attention

- **`lib/idempotency.ts`** has no exported functions yet (just imports) — nothing to test.
- **`app/api/payments/callback/route.ts`** interpolates `tx_ref` straight into HTML with
  no escaping. I wrote a test that documents this rather than "fixing" it silently —
  worth a look since `tx_ref` comes from the query string.
- Route tests mock `@/lib/prisma` entirely, so they verify *application logic*, not real
  Prisma query correctness — you'd want integration tests against a real/test DB for that.
- `bcrypt` tests use the real library (not mocked) since it's cheap enough and hashing
  behavior itself is worth verifying; this makes that file the slowest (~700ms total).
