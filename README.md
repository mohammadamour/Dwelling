# Dwelling — Full-Stack Real Estate Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**Dwelling** is a modern, decoupled full-stack real estate marketplace platform connecting home seekers, property owners, and licensed real estate agents. The project combines a responsive, zero-build vanilla frontend with a type-safe Node.js / Express backend powered by Prisma ORM and hosted PostgreSQL on Supabase.

---

## 🏗️ System Architecture

Dwelling employs a decoupled multi-page application (MPA) client communicating with a REST API backend:

```
┌────────────────────────────────────────────────────────┐
│               FRONTEND LAYER (FrontEnd/)               │
│   • Semantic HTML5 Multi-Page Application (MPA)        │
│   • Vanilla CSS with Custom Properties Design Tokens   │
│   • Native ES6 JavaScript Modules (No Bundler Needed)  │
│   • Centralized API Service in js/api.js               │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│                API BACKEND (server/)                   │
│   • Node.js (v20+) & Express 5.x                       │
│   • TypeScript 5.9 with ES2020 Target                  │
│   • Prisma ORM 6.4 (Data Modeling & Migrations)        │
│   • Hardened HS256 JWT Auth & bcryptjs Hashing         │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma Client
┌───────────────────────────▼────────────────────────────┐
│               DATABASE (Supabase Cloud)                │
│   • Hosted PostgreSQL 15+ Instance                     │
│   • Connection Pooler (Port 5432 / 6543)               │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Key Implemented Features

### 🔍 Property Catalog & Search
- **Dynamic Filtering**: Filter listings by search keyword (`title`, `city`, `address`, `state`, `zip`), property type (`HOUSE`, `APT`, `CONDO`, `TOWNHOUSE`), price type (`RENT`, `SALE`), price range, bedrooms, bathrooms, and featured status.
- **Server-Side Pagination & Sorting**: Paginated results with `page` and `limit`, sortable by price, date created, or featured priority.
- **Single Property Details**: Rich detail view featuring a responsive two-column content grid, interactive photo gallery carousel, property specifications, agent profile card, and client reviews.
- **Interactive Agent Inquiry Flow**: Stateful client-side inquiry drawer with character counting, dynamic agent-specific placeholders, loading simulation, and feedback confirmations.

### 🔐 Hardened Authentication & Security
- **Secure Password Hashing**: Passwords salted and hashed with `bcryptjs`.
- **JWT Verification**: Tokens signed and validated using explicit `HS256` algorithms with strict Bearer header parsing.
- **Startup Secret Validation**: Fails gracefully on boot if `JWT_SECRET` is absent or set to an insecure default.
- **Privilege Escalation Protection**: Public registration strictly permits `SEEKER` or `AGENT` roles (defaulting to `SEEKER`). Direct assignment of `ADMIN` via registration or profile updates is rejected with `403 Forbidden`.
- **Admin Role Management**: Role elevations to `ADMIN` are restricted to the protected `PATCH /api/users/:id/role` endpoint.
- **Dynamic CORS**: Whitelists origins dynamically based on `ALLOWED_ORIGINS` / `CLIENT_URL`.

### 🏢 Real Estate Agent Workflows
- **Agent Role Guard**: Dedicated `POST /api/properties` endpoint restricted to authenticated agents and administrators.
- **Property Publishing**: Listing creation form capturing property specs, pricing, address details, and image galleries.
- **Agent Profiles & Connections**: Linked `AgentProfile` records tracking license numbers, agency names, years of experience, ratings, and total sales, integrated directly into listing detail cards.

### 📊 Live Platform Metrics
- **Real-Time Database Statistics**: Hero counters and platform statistics dynamically aggregated from PostgreSQL (total listings, active agents, covered cities, and average pricing).
- **Newsletter Subscription**: Email capture pipeline with deduplication and upsert handling.

---

## 🗺️ Roadmap & Upcoming Features

The database schema ([schema.prisma](file:///c:/Users/somet/Downloads/Coding/Dwelling/server/prisma/schema.prisma)) and active API controllers define the following features and active development milestones:

- [x] **Tour Booking System (`TourBooking`)**: Schedule in-person and virtual walkthroughs with date/time picker and dashboard status tracking (`REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- [x] **Saved Favorites (`Favorite`)**: Authenticated user bookmarking with persistent toggle endpoints and profile collection view.
- [x] **Reviews & Ratings System (`Review`)**: Interactive 5-star rating picker, verified reviews listing, and client-side review submission.
- [x] **Interactive Agent Inquiry State**: Inline expandable messaging flow on the property details agent card with mock state machine and submission feedback.
- [x] **Property Review Card UI Polish**: Resolve text wrapping and overflow handling within review cards, and implement reviewer avatar fallbacks.
- [ ] **Enriched Review Mock Data**: Seed diverse reviews, ratings, and realistic reviewer commentary across listings.
- [ ] **Cloud Storage Asset Pipeline**: Supabase Storage / S3 pre-signed upload URLs for direct client image uploads.
- [ ] **Interactive Maps**: Mapbox / Leaflet integration utilizing property latitude and longitude coordinates.
- [ ] **Real-Time Agent Chat**: Persistent WebSocket direct messaging between home seekers and listing agents.

---

## 📡 API Reference

Base API URL: `http://localhost:5001/api`

### Authentication & Users
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new seeker or agent account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Validate session and retrieve profile |
| `GET` | `/api/users/me` | Authenticated | Retrieve authenticated user profile |
| `PUT` | `/api/users/me` | Authenticated | Update personal profile details |
| `PATCH`| `/api/users/:id/role` | Admin Only | Assign or modify a user's account role |

### Properties & Stats
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | Public | Search properties with filters & pagination |
| `GET` | `/api/properties/:id` | Public | Fetch detailed property by ID with relations |
| `GET` | `/api/properties/featured` | Public | Fetch top featured listings |
| `GET` | `/api/properties/stats` | Public | Aggregate platform property statistics |
| `GET` | `/api/stats` | Public | Canonical alias for `/api/properties/stats` |
| `POST` | `/api/properties` | Agent / Admin | Create a new property listing |
| `POST` | `/api/tours` | Authenticated | Schedule in-person or virtual walkthrough visit |
| `POST` | `/api/favorites/:propertyId/toggle` | Authenticated | Toggle saved property bookmark status |
| `POST` | `/api/properties/:id/reviews` | Authenticated | Submit property rating & review |
| `POST` | `/api/newsletter` | Public | Subscribe email to newsletter updates |
| `GET` | `/api/health` | Public | Server healthcheck probe |

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **Python 3** (for serving the static frontend) or any local HTTP server
- **PostgreSQL**: A local instance or a hosted [Supabase](https://supabase.com/) project

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/mohammadamour/Dwelling.git
cd Dwelling
```

---

### Step 2: Configure Environment Variables

Navigate to the `server/` directory and copy the environment template:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and configure the following variables:

```env
# Server Port Configuration
PORT=5001
NODE_ENV=development

# Database Connection (Supabase PostgreSQL)
# Transaction-mode connection pooler:
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Direct connection pooler (used for schema migrations):
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Authentication Security (REQUIRED)
# Generate a secure 64-character secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=replace_with_a_secure_random_64_character_secret_key

# Allowed CORS Origins (comma-separated whitelist)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500,http://localhost:5001
```

---

### Step 3: Install Backend Dependencies
From the `server/` directory:
```bash
npm install
```

---

### Step 4: Database Setup & Seeding

Synchronize your Prisma schema with your PostgreSQL database:

```bash
# Push schema directly to database
npx prisma db push

# (Alternatively) Run database migrations
npx prisma migrate dev
```

Seed initial test data (generates test users, agents, 18 properties with images, reviews, and subscribers):

```bash
npm run db:seed
```

#### Pre-Configured Test Credentials (after seeding):
- **Home Seeker:** `testuser1@example.com` / `password123`
- **Home Seeker:** `testuser2@example.com` / `password123`
- **Listing Agent:** `testagent@example.com` / `password123`

---

### Step 5: Start the Backend API Server

```bash
npm run dev
```

The API server will boot on `http://localhost:5001`:
```text
✅ Connected to Supabase PostgreSQL via Prisma
🚀 Dwelling API running on http://localhost:5001
   Health check: http://localhost:5001/api/health
   Properties:   http://localhost:5001/api/properties
   Stats:        http://localhost:5001/api/stats
```

---

### Step 6: Serve the Frontend Client

Open a **second terminal window** in the project root. Because modern browsers restrict native ES6 JavaScript modules over the `file://` protocol, serve the `FrontEnd/` directory over HTTP:

**Using Python:**
```bash
python -m http.server 5500 --directory FrontEnd
```

**Using npx (Node):**
```bash
npx serve FrontEnd -l 5500
```

*(Or use the **VS Code / Cursor Live Server** extension on `FrontEnd/index.html`).*

Open your browser and navigate to:
👉 **[http://localhost:5500](http://localhost:5500)**

---

## 📁 Repository Structure

```text
Dwelling/
├── AGENTS.md                  # System architecture, guidelines, and engineering contracts
├── README.md                  # Primary developer documentation & setup guide
├── FrontEnd/                  # Frontend client application (MPA)
│   ├── index.html             # Landing page with hero search & featured listings
│   ├── css/                   # Vanilla CSS & custom property design tokens
│   │   ├── main.css           # Global typography, layout tokens & reset
│   │   ├── shared.css         # Reusable navigation, buttons, cards & modals
│   │   ├── auth.css           # Login & registration form styles
│   │   ├── properties.css     # Catalog search & filter grid layout
│   │   └── property-details.css # Gallery carousel & specs styling
│   ├── js/                    # Native ES6 JavaScript modules
│   │   ├── api.js             # Centralized API fetch wrapper & JWT token manager
│   │   ├── shared.js          # Dynamic header auth state, mobile drawer & formatters
│   │   ├── landing.js         # Animated counters, newsletter & featured listings
│   │   ├── properties.js      # Filter state, debounce search & pagination
│   │   ├── property-details.js# Image gallery thumbs, reviews & details loader
│   │   ├── login.js           # Authentication handler
│   │   ├── register.js        # Account registration with role selection
│   │   ├── profile.js         # User profile viewer & editor
│   │   └── add-property.js    # Agent listing submission handler
│   └── pages/                 # Multi-page application sub-pages
│       ├── login.html
│       ├── register.html
│       ├── properties.html
│       ├── property-details.html
│       ├── profile.html
│       └── add-property.html
└── server/                    # Node.js & Express REST API
    ├── .env                   # Active environment variables (git-ignored)
    ├── .env.example           # Environment template documentation
    ├── package.json           # Server dependencies & scripts
    ├── tsconfig.json          # TypeScript compiler configuration
    ├── prisma/
    │   ├── schema.prisma      # Database schema models & enums
    │   └── seed.ts            # Database seeder with mock properties & users
    └── src/
        ├── index.ts           # Server entry point, CORS & middleware
        ├── config/
        │   └── env.ts         # Centralized environment & JWT secret validator
        ├── middleware/
        │   └── auth.ts        # JWT authentication & role authorization guards
        ├── routes/
        │   ├── auth.ts        # Authentication routes (/api/auth)
        │   ├── userRoutes.ts  # User profile & admin role routes (/api/users)
        │   ├── propertyRoutes.ts # Listings & stats routes (/api/properties)
        │   └── stats.ts       # Canonical stats alias route (/api/stats)
        └── controllers/
            ├── propertyController.ts # Properties, filters & stats business logic
            └── userController.ts     # User profile & role modification logic
```

---

## 🔒 Security Best Practices Implemented

- **No Hardcoded Secrets**: Secrets are read exclusively from environment variables with boot-time schema validation.
- **Timing-Safe Password Verification**: Implemented using `bcryptjs` with salt rounds.
- **Algorithm Confusion Defense**: JWT decoding explicitly specifies `{ algorithms: ['HS256'] }`.
- **Privilege Separation**: Users cannot self-assign administrative roles during registration or profile updates.
- **Sanitized Errors**: Internal database engine errors and stack traces are suppressed in production environments.

---

## 📌 Project Disclaimer & Attribution

- **Learning & Portfolio Project**: Dwelling was built as an educational and portfolio project to explore decoupled full-stack architecture, database modeling with Prisma, authentication hardening, and API engineering. While the application is functional and being actively polished for production deployment, it is not a commercial real estate agency or active brokerage service.
- **Design Attribution**: The frontend interface concept was recreated for practice and experimentation based on an online design. All listings, property photography, agent personas, reviews, and statistics shown throughout the application are demonstration mock data.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
