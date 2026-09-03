# Dwelling — Architecture & Engineering Guidelines

This document serves as the single source of truth for architectural conventions, engineering rules, security constraints, and foundational domain stubs across the Dwelling real estate platform.

---

## 1. System Architecture & Tech Stack

Dwelling is a decoupled full-stack real estate marketplace application:

```
┌────────────────────────────────────────────────────────┐
│               FRONTEND LAYER (FrontEnd/)               │
│   • HTML5 Multi-Page Application (MPA)                 │
│   • Vanilla CSS with Custom Properties Design Tokens   │
│   • Native ES6 Modules (No Bundler Required)           │
│   • Centralized Client Service in js/api.js            │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│                API BACKEND (server/)                   │
│   • Node.js (v20+) & Express 5.x                       │
│   • TypeScript 5.9 (ES2020 target)                     │
│   • Prisma ORM 6.4 (Data Access & Migrations)          │
│   • Custom JWT Auth (HS256) & bcryptjs Password Hash   │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma Client
┌───────────────────────────▼────────────────────────────┐
│               DATABASE (Supabase Cloud)                │
│   • Hosted PostgreSQL 15+ Instance                     │
│   • Shared Connection Pooler (Port 5432 / 6543)        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Security & Authentication Constraints

1. **Environment Configuration**:
   - `JWT_SECRET` must be set in `server/.env`.
   - The application enforces a strict boot check in `server/src/config/env.ts` and will terminate if `JWT_SECRET` is missing, empty, or set to a known insecure placeholder string.
   - All token signing and verification operations must explicitly enforce the `HS256` algorithm to prevent algorithm confusion attacks.

2. **Privilege Escalation Prevention**:
   - Public registration (`POST /api/auth/register`) only permits `SEEKER` or `AGENT` roles, defaulting strictly to `SEEKER`.
   - Any client attempt to pass `role: "ADMIN"` or `isAdmin: true` during registration is rejected with `403 Forbidden`.
   - Public profile updates (`PUT /api/users/me`) strictly forbid modifying account roles.
   - Role elevation to `ADMIN` is strictly limited to direct database operations or the protected `PATCH /api/users/:id/role` endpoint, guarded by `requireRole(['ADMIN'])`.

3. **CORS Hardening**:
   - Allowed origins are dynamically loaded from `ALLOWED_ORIGINS` or `CLIENT_URL` environment variables.
   - Localhost origins are permitted in non-production environments (`NODE_ENV !== 'production'`).

---

## 3. API Conventions & Standardized Envelopes

### Envelope Pattern
All JSON responses should follow a consistent data envelope:
- Singular resources: `{ data: <resource>, <resourceName>: <resource> }` (e.g., `{ data: user, user: user }`).
- List resources: `{ data: <items>[], meta: { total, page, limit, totalPages } }`.
- Error responses: `{ error: "<descriptive message>" }`.

### User Context (`/me`)
Both session endpoints are unified under the same controller handler:
- `GET /api/users/me` (Canonical user profile endpoint)
- `GET /api/auth/me` (Canonical alias for session validation)
Both return:
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "SEEKER",
    "_count": { "favorites": 0, "reviews": 0 }
  },
  "user": { ... }
}
```

### Property Statistics
- `GET /api/properties/stats` is the canonical property metrics endpoint.
- `GET /api/stats` is preserved as an alias sharing the exact same controller logic.

---

## 4. Foundational Stubs for Incomplete Features

The database schema (`server/prisma/schema.prisma`) defines several domain models whose API contracts are planned:

1. **Tour Booking System (`TourBooking`)**:
   - Models: `TourType` (`IN_PERSON`, `VIRTUAL`), `TourStatus` (`REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
   - Planned Routes: `POST /api/properties/:id/tours`, `GET /api/bookings/my`, `PATCH /api/bookings/:id/status`.

2. **Favorites System (`Favorite`)**:
   - Models: `Favorite` with composite unique index `@@unique([userId, propertyId])`.
   - Planned Routes: `POST /api/properties/:id/favorite` (toggle), `GET /api/favorites/my`.

3. **Reviews & Ratings System (`Review`)**:
   - Models: `Review` (ratings 1–5, comments, relations to property and reviewer).
   - Planned Routes: `POST /api/properties/:id/reviews`, `GET /api/properties/:id/reviews`.

4. **Asset Upload Pipeline**:
   - Property listing image uploads should be migrated from raw URL inputs to Supabase Storage or S3 pre-signed URLs.

---

## 5. Coding & Style Rules

- **Client Code**:
  - Keep styling consistent with CSS custom properties in `FrontEnd/css/shared.css` and `main.css`.
  - Use `apiFetch` in `FrontEnd/js/api.js` for all backend communication; do not write raw `fetch` calls with hardcoded URLs.
  - Check authentication state via `isAuthenticated()` and parse user claims using `getAuthUser()`.
- **Server Code**:
  - Keep controllers in `server/src/controllers/` and routes in `server/src/routes/`.
  - Do not use loose `any` types; prefer Prisma-generated types and Express Request/Response interfaces.
  - Never commit credentials, `.env` files, or production secrets to Git.
