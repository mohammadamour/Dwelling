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

## 4. Domain Models & Core Subsystems

The database schema (`server/prisma/schema.prisma`) defines the following active core domain subsystems:

1. **Favorites & Bookmarks System (`Favorite`)**:
   - Models: `Favorite` with composite unique index `@@unique([userId, propertyId])`.
   - Routes:
     - `POST /api/favorites/:propertyId/toggle` (Toggle bookmark status)
     - `POST /api/favorites/:propertyId` (Explicit add)
     - `DELETE /api/favorites/:propertyId` (Explicit remove)
     - `GET /api/favorites/my` (List all saved properties for current user)
   - UI Integration: Heart icons on landing cards, catalog cards, and details page persist state to PostgreSQL and render filled/unfilled based on authentication.

2. **Tour Booking System (`TourBooking`)**:
   - Models: `TourType` (`IN_PERSON`, `VIRTUAL`), `TourStatus` (`REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
   - Routes:
     - `POST /api/tours` (Schedule in-person or virtual walkthrough visit)
     - `GET /api/tours/my` (List user scheduled tours with property and agent relations)
     - `PATCH /api/tours/:id/status` (Update status or cancel visit)
   - UI Integration: "Schedule a Tour" modal on property details page with date, time, format selection, and user profile appointments dashboard.

3. **Reviews & Ratings System (`Review`)**:
   - Models: `Review` (ratings 1–5, comments, relation to property and reviewer).
   - Routes:
     - `POST /api/properties/:id/reviews` (Publish new rating and comment)
     - `GET /api/properties/:id/reviews` (Fetch property reviews with reviewer profiles)
   - UI Integration: Interactive 5-star rating picker and comment submission box on property details page.

4. **Agent Profiles & Connections (`AgentProfile`)**:
   - Models: `AgentProfile` linked one-to-one with `User` (`role: AGENT`).
   - Routes:
     - `GET /api/agents` (List agents with rating, license, experience, and listing count)
     - `GET /api/agents/:id` (Single agent profile with active listings)
   - UI Integration: Agent contact card on listing detail page displays agency name, ratings, phone, and email.

---

## 5. Coding & Style Rules

- **Client Code**:
  - Keep styling consistent with CSS custom properties in `FrontEnd/css/shared.css` and `main.css`.
  - Use `apiFetch` in `FrontEnd/js/api.js` for all backend communication; do not write raw `fetch` calls with hardcoded URLs.
  - Environment configuration is managed in `FrontEnd/js/config.js` via `resolveApiBaseUrl()` (supporting `window.__DWELLING_API_BASE_URL__`, `<meta name="dwelling-api-url">`, `localStorage`, `DWELLING_CONFIG.productionApiUrl`, and auto-detecting localhost vs. production relative `/api`).
  - Check authentication state via `isAuthenticated()` and parse user claims using `getAuthUser()`.
- **Server Code**:
  - Keep controllers in `server/src/controllers/` and routes in `server/src/routes/`.
  - Do not use loose `any` types; prefer Prisma-generated types and Express Request/Response interfaces.
  - Never commit credentials, `.env` files, or production secrets to Git.

---

## 6. Recent Frontend Iterations & UI Architecture

### Property Detail View (`FrontEnd/pages/property-details.html`)
- **Two-Column Content Grid**:
  - Main layout container (`.property-info`) enforces a two-column grid (`grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); gap: var(--s-8); align-items: start;`) on desktop (`>= 1024px`), collapsing to single-column (`1fr`) on tablet and mobile.
  - **Left Column (`.property-info__main`)**: Houses the hero photo gallery (`.property-gallery`), property specifications grid, written description, and reviews section.
  - **Right Sidebar Column (`.property-info__sidebar`)**: Houses the Agent Information Card (`.agent-card`) positioned at the top to align horizontally with the top edge of the primary hero image block, followed by the price & tour booking card (`.price-card`).

### Agent Information Component & Interactive Inquiry Flow
- **Consolidated Action**: Removed secondary "View Profile" button to eliminate clutter; elevated "Message Agent" as the primary full-width CTA.
- **Inline Expandable Inquiry Form**: Clicking "Message Agent" toggles an inline inquiry textarea (`#agentInquiryForm`) with character counter (`0/300`), dynamic agent-specific placeholder, and Cancel/Send action buttons.
- **Stateful Mock Submission**:
  - Clicking "Send" validates input, disables form controls, and triggers an 800ms loading state with an animated inline spinner (`"Sending..."`).
  - Upon completion, displays a green success confirmation badge (*"Message sent to [Agent Name]!"*).
  - Automatically resets to default after 5 seconds or via manual "Send another inquiry" / "Cancel" without page reload.
  - Handled purely via client-side component state machine (`initAgentInquiry()` in `FrontEnd/js/property-details.js`) without backend dependencies.

### Established CSS & DOM Guidelines
- **Strict CSS Scoping**: Avoid declaring generic component classes (such as `.agent-card`) with global `position: absolute` or transform rules in page-specific stylesheets. Page-specific positioning must always be scoped to its parent container (e.g. `.about__media .agent-card`).
- **Explicit Layout Overrides**: Standalone cards used across multiple views must enforce `position: relative`, `right: auto`, `transform: none`, and `box-sizing: border-box` to sit flush within CSS grid columns.
- **Resilient DOM Selectors**: Use explicit element IDs (`#openInquiryBtn`, `#agentInquiryForm`, `#agentInquirySuccess`) for interactive feature bindings to ensure resilience against layout adjustments.
- **Property Review Component**:
  - Review card items (`.review-card`) use scoped CSS internal padding (`padding: var(--s-5)`), flex column structure, and `word-break: break-word` / `overflow-wrap: break-word` on review body text (`.review-card__text`).
  - Desktop view uses responsive indentation (`@media (min-width: 640px) { .review-card__body { padding-left: calc(44px + var(--s-3)); } }`) to align review text directly under author credentials.
  - Reviewer avatars implement dynamic fallback placeholders (`.review-card__avatar-fallback`) with user initials and brand-tailored color themes when `avatarUrl` is null or fails to load, falling back to a neutral SVG icon when no name is provided.

- **Realistic Review Mock Data Seeding**:
  - Modular Review Factory in `server/prisma/factories/reviewFactory.ts` generates realistic, authentic property reviews strictly avoiding lorem ipsum.
  - Sourced reviewers directly from verified agent user accounts with high-resolution Unsplash headshots.
  - Generates a believable positive distribution (~65% 5-star, ~25% 4-star, ~10% 3-star) with 2–5 reviews per property listing.
  - Integrated into main seed (`npm run db:seed`) and standalone re-seed (`npm run db:seed:reviews`).

---

## 7. Immediate Next Tasks

1. **Cloud Storage Asset Pipeline**:
   - Integrate Supabase Storage or S3 pre-signed upload URLs for direct client property image and avatar uploads.
2. **Interactive Maps**:
   - Leaflet or Mapbox integration on property catalog and detail pages utilizing latitude and longitude coordinates.
