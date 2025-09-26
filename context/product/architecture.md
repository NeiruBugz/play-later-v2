# System Architecture Overview: PlayLater

---

## 1. Application & Technology Stack

- **Package Manager:** Bun (high-performance package management and script execution)
- **Full-Stack Framework:** Next.js 15 with App Router (server-side rendering, server actions, optimized performance)
- **Frontend Framework:** React 19 with TypeScript (modern React features with type safety)
- **Styling & UI:** Tailwind CSS + shadcn/ui components (consistent design system)
- **Server-Side Logic:** Hybrid approach - Server Actions for mutations, Route Handlers for read operations (leveraging Next.js caching)
- **Form Management:** React Hook Form with Zod validation (type-safe form handling)
- **State Management:** TanStack Query for client-side data fetching and caching

---

## 2. Data & Persistence

- **Primary Database:** PostgreSQL with Prisma ORM (relational data for users, games, backlog items, reviews, Steam integrations)
- **Database Migrations:** Prisma migrations (version-controlled schema changes)
- **Caching Strategy:** Next.js built-in Route Handler caching (no additional caching layer initially)

---

## 3. Infrastructure & Deployment

- **Current Hosting:** Vercel (Next.js optimized deployment) + Neon Database (PostgreSQL)
- **Planned Migration:** AWS ECS Fargate (containerized Next.js app) + AWS RDS PostgreSQL (managed database)
- **Environment Management:** Separate development/production environments with environment variables
- **Deployment:** Automated CI/CD through Vercel (current) / AWS deployment pipeline (planned)

---

## 4. External Services & APIs

- **Primary Authentication:** NextAuth.js v5 with Google OAuth (user sign-up and login)
- **Steam Integration:** Steam OpenID (secondary account linking for Steam library import)
- **Game Metadata:** IGDB API (game information, covers, similar games discovery)
- **Steam Data:** Steam Web API (library imports, achievement tracking with rarity analysis)
- **Future Platform APIs:** Xbox Live API, PlayStation Network API (planned for Phase 3 multi-platform integration)

---

## 5. Observability & Monitoring

- **Development Monitoring:** Next.js built-in development tools and console logging
- **Production Logging:** CloudWatch integration (when migrated to AWS ECS/RDS)
- **Error Handling:** Custom error boundaries and server action error responses
- **Performance Monitoring:** Next.js built-in performance metrics and Core Web Vitals tracking
