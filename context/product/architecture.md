# System Architecture Overview: SavePoint

---

## 1. Application & Technology Stack

**Full-Stack Framework:** Next.js 15 with App Router

- Server Components for game detail pages and library views (SEO-optimized, efficient data fetching)
- Server Actions for mutations (add game, write journal entry, update library status)
- API Routes (minimal usage - primarily for authentication callbacks)
- React 19 with TypeScript for type-safe component development
- Turbopack for fast development builds and production optimization

**Frontend Stack:**

- **UI Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS for utility-first styling
- **Component Library:** shadcn/ui for accessible, customizable UI primitives
- **State Management:** TanStack Query for server state synchronization and caching
- **Form Handling:** React Hook Form with Zod validation

**Data Flow Architecture (Enforced via ESLint boundaries):**

```
Server Action / Server Component / Route Handler
  ↓ Input validation (Zod schemas)
  ↓ Authorization check (user session via NextAuth)
  ↓
Service Layer (data-access-layer/services/)
  ↓ Business logic implementation
  ↓ Returns Result<TData, TError> types
  ↓
Repository Layer (data-access-layer/repository/)
  ↓ Pure Prisma operations (domain-organized)
  ↓
Prisma ORM → PostgreSQL
```

**Server Action Framework:** next-safe-action

- Type-safe server actions with automatic input validation
- Built-in authorization middleware (`authorizedActionClient`)
- Reduces boilerplate for validation/auth before service layer
- Consistent error handling patterns

**Import Aliases:** All imports use `@/` alias from repository root for clean, relocatable imports

---

## 2. Authentication & Authorization

**Authentication Provider:** NextAuth v5 (Beta)

- **Primary Method:** Google OAuth for production user authentication
- **Secondary Method:** Credentials provider (email/password) for E2E testing with Playwright
- Configuration: `auth.ts` at project root

**Session Management:**

- Database sessions via Prisma Adapter (persistent, server-side validation)
- Session storage in PostgreSQL for security and consistency
- Server-side session access via `getServerUserId()` helper function

**Authorization Pattern:**

```typescript
// Server Action with next-safe-action
export const addGameToLibrary = authorizedActionClient
  .inputSchema(AddGameSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    // userId automatically extracted from session
    // Input automatically validated against Zod schema
    return GameService.addToLibrary(userId, parsedInput);
  });
```

**Security Principles:**

- All mutations require authenticated session
- User ID extracted from session (never from client input)
- Authorization checks happen before service layer execution
- Session tokens stored securely (httpOnly cookies)

---

## 3. Data & Persistence

**Primary Database:** PostgreSQL

- Relational data model for users, games (IGDB metadata cache), library items, journal entries, collections
- Local development: Docker Compose on `localhost:6432`
- Production: AWS RDS PostgreSQL with automated backups and multi-AZ deployment
- ACID compliance ensures data integrity for critical operations (journal entries, library updates)

**ORM Layer:** Prisma

- Type-safe database access with generated TypeScript types
- Migration management via `prisma migrate`
- Connection pooling (min: 2, max: 10 connections)
- Prisma Studio for local database inspection

**Database Schema Design (Phase 1):**

- `User`: Authentication data, profile information
- `Game`: IGDB metadata cache (covers, descriptions, platforms, release dates)
- `LibraryItem`: User's games with journey status (Curious About, Currently Exploring, Taking a Break, Experienced, Wishlist, Revisiting)
- `JournalEntry`: User reflections linked to specific games with timestamps
- `Collection`: Themed game collections (Phase 2 feature, schema supports early)

**Caching Strategy:**

- **Phase 1:** No separate caching layer (PostgreSQL performance sufficient for MVP)
- **Application-level caching:** Next.js Server Components provide built-in request memoization
- **IGDB response caching:** Game metadata stored in PostgreSQL `Game` table acts as persistent cache
- **Future consideration:** Redis for session storage and hot-path queries if performance metrics indicate need

---

## 4. External Services & APIs

**Game Metadata:** IGDB (Internet Games Database)

- Primary source for game metadata: covers, descriptions, platforms, release dates, genres, franchises
- OAuth 2.0 token management with 60-second safety margin before expiry
- Rate limiting handled by service layer with exponential backoff
- **Current refactoring plan:**
  - Deprecate legacy `shared/lib/igdb.ts` utility
  - Consolidate to `data-access-layer/services/igdb/igdb-service.ts`
  - Extract types to `igdb-api-types` package for unified type definitions across codebase

**Platform Integration (Phase 2):**

- **Steam Web API:** Library import, game ownership verification, achievement synchronization
- **Steam OpenID:** Authentication integration (already configured in NextAuth for future use)

**File Storage (Phase 3+):**

- **AWS S3:** Journal screenshot uploads, user profile images
- **LocalStack:** S3-compatible local storage for development and integration testing
- Bucket structure: `play-later-{env}/journal-screenshots/{userId}/{entryId}/`
- Security: Pre-signed URLs for time-limited upload/download access

**API Integration Patterns:**

- Service layer encapsulates all external API calls
- Retry logic with exponential backoff for transient failures
- Circuit breaker pattern for degraded service scenarios
- Structured logging for API latency and error tracking

---

## 5. Infrastructure & Deployment

**Cloud Provider:** AWS

- **Database:** RDS PostgreSQL with automated backups, multi-AZ for high availability in production
- **File Storage:** S3 for journal screenshots and user-generated content (Phase 3+)
- **Compute:** ECS Fargate for containerized Next.js application (no EC2 management overhead)
- **Networking:** VPC with private subnets for RDS, public subnets for ALB
- **Load Balancing:** Application Load Balancer for SSL termination and traffic distribution

**Infrastructure as Code:** Terraform

- Codified infrastructure in `terraform/` directory
- Environment separation: `dev`, `staging`, `production`
- Managed resources: RDS instances, ECS cluster/service definitions, S3 buckets, IAM roles, VPC configuration
- State management: S3 backend with DynamoDB state locking
- Solo developer context: Simple, maintainable configurations without complex module abstractions

**Local Development Environment:**

- **Docker Compose:** PostgreSQL (port 6432), pgAdmin (port 5050)
- **LocalStack:** S3-compatible storage for testing file upload workflows
- **Environment variables:** `.env` file (never committed, `.env.example` provided)
- Development server: `localhost:6060` (non-standard port to avoid conflicts)

**CI/CD Pipeline (GitHub Actions):**

**PR Checks** (`.github/workflows/pr-checks.yml`):

- Code formatting validation (Prettier)
- Linting with architectural boundary enforcement (ESLint with boundaries plugin)
- TypeScript type checking (strict mode)
- Unit tests (`pnpm test --project=unit`)
- Integration tests (`pnpm test --project=integration` with Docker Compose)
- Component tests (`pnpm test --project=components`)
- Migration validation: Schema drift detection, destructive operation warnings

**Deployment Workflow** (`.github/workflows/deploy.yml` - future enhancement):\*\*

- Database migrations via `prisma migrate deploy` (safe, idempotent)
- Docker image build and push to Amazon ECR
- ECS service update with rolling deployment strategy
- Health check validation before completing deployment
- Automatic rollback on health check failure

**Current Focus:** Quality gates and migration safety validation. Full deployment automation to ECS deferred until production readiness.

**Deployment Strategy:**

- Blue-green deployments for zero-downtime updates
- Database migrations run before application deployment
- Feature flags for gradual rollout of new features

---

## 6. Observability & Monitoring

**Application Logging:** Pino

- Structured JSON logging for queryability in CloudWatch Logs Insights
- Request correlation IDs for distributed tracing across service boundaries
- Log levels: `ERROR` (system failures), `WARN` (rate limits, degraded service), `INFO` (user actions, key events), `DEBUG` (development diagnostics)
- Automatic stdout streaming to CloudWatch Logs in ECS Fargate environment

**Log Context Pattern:**

```typescript
logger.info("Journal entry created", {
  userId: user.id,
  gameId: game.id,
  entryId: entry.id,
  requestId: req.id,
  duration: 145,
});
```

**Infrastructure Monitoring:** AWS CloudWatch

- **Logs:** Centralized log aggregation from ECS tasks with 30-day retention
- **Metrics:** ECS task health (CPU, memory, task count), RDS performance (connections, query latency), ALB metrics (request count, error rates)
- **Alarms:** Error rate spikes, database connection pool exhaustion, disk space warnings, task failure alerts
- **Log Insights:** Pre-configured queries for common debugging scenarios (HTTP 5xx errors, IGDB API failures, database errors)

**Database Monitoring:** RDS Performance Insights

- Slow query detection with query plan analysis
- Connection pool utilization monitoring
- Automatic recommendations for query optimization
- Built-in to RDS (zero additional setup for solo developer)

**Error Tracking Strategy:**

- CloudWatch Logs Insights queries for error aggregation
- Custom dashboards for key metrics visualization
- Low-cost alternative to third-party APM tools (appropriate for solo developer context)

**Key Metrics to Track (Phase 1):**

- **IGDB API:** Call latency (p50, p95, p99), error rates, token refresh frequency
- **Journal Entries:** Creation success rate, read latency, user engagement patterns
- **User Authentication:** Sign-in success rate, OAuth callback failures, session duration
- **Database Performance:** Query execution time, connection pool saturation, slow query alerts

**Alerting Strategy:**

- Critical: Database connection failures, application crash loops → SMS notification
- Warning: High error rates, API rate limit approaching → Email notification
- Info: Deployment completion, migration success → Dashboard only

**Solo Developer Context:** All monitoring tooling is AWS-native to minimize operational overhead and avoid additional service management.

---

## 7. Testing Strategy

**Testing Philosophy:** Test-driven development with emphasis on service layer correctness and repository data integrity. Solo developer context requires comprehensive tests that catch regressions without maintenance burden.

**Test Pyramid:**

```
       /\
      /E2E\         Future: 5-10 critical flows (Playwright)
     /------\       Phase 2+: Auth → Import → Journal
    /Integr-\       30-50 tests: Repository + full service flows
   /----------\     Real PostgreSQL via Docker
  /   Unit     \    100-200 tests: Services, utilities, components
 /--------------\   Mocked dependencies for speed
```

**Test Types & Execution:**

**1. Unit Tests** (`.unit.test.ts`)

- **Scope:** Service business logic, utilities, pure functions, validation logic
- **Environment:** Node
- **Dependencies:** Mocked Prisma client, mocked external APIs (IGDB)
- **Speed:** Fast (<5s for full suite, no I/O operations)
- **Setup File:** `test/setup/unit-setup.ts` with global Prisma/NextAuth mocks
- **Example scenarios:** Service Zod validation errors, Result type handling, edge case logic, utility functions

**2. Integration Tests** (`.integration.test.ts`)

- **Scope:** Repository layer, end-to-end service-to-database flows
- **Environment:** Node with real PostgreSQL (Docker Compose)
- **Database Strategy:** Isolated test database per suite (`play-later-test-{timestamp}`)
- **Lifecycle:** Database created in `beforeAll`, migrations applied, dropped in `afterAll`
- **Execution:** Sequential (prevents database conflicts between test suites)
- **Speed:** Moderate (15s timeout for database operations)
- **Setup File:** `test/setup/integration-setup.ts` with Prisma migrations
- **Example scenarios:** Repository CRUD operations, transaction handling, complex queries, data consistency

**3. Component Tests** (`.test.tsx`, `.spec.tsx`)

- **Scope:** React components, UI interactions, form validation
- **Environment:** jsdom (browser-like environment)
- **API Mocking:** MSW (Mock Service Worker) for `/api/*` route interception
- **Speed:** Moderate (10s timeout)
- **Setup File:** `test/setup/client-setup.ts` with Testing Library, MSW handlers
- **Example scenarios:** Game search with debouncing, modal interactions, form validation feedback

**4. E2E Tests** (Deferred to Phase 2+)

- **Tool:** Playwright with TypeScript
- **Scope:** Critical user journeys (Google OAuth sign-in → Steam library import → journal entry creation)
- **Authentication:** Credentials provider for programmatic test account creation
- **Database:** Isolated test database per Playwright worker
- **CI Integration:** Block PRs on E2E failure once implemented
- **Deferred reason:** User flows must exist before meaningful E2E tests can be written

**Vitest Configuration Structure:**

```typescript
// vitest.config.ts (three-project architecture)
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [".next/", "app/", "test/", "*.config.*", "**/*.d.ts"],
    },
    projects: [
      {
        name: "unit",
        environment: "node",
        include: ["**/*.unit.test.ts"],
        setupFiles: ["./test/setup/unit-setup.ts"],
        testTimeout: 5000,
      },
      {
        name: "integration",
        environment: "node",
        include: ["**/*.integration.test.ts"],
        setupFiles: ["./test/setup/integration-setup.ts"],
        testTimeout: 15000,
        poolOptions: { threads: { singleThread: true } },
      },
      {
        name: "components",
        environment: "jsdom",
        include: ["**/*.{test,spec}.tsx"],
        setupFiles: ["./test/setup/client-setup.ts"],
        testTimeout: 10000,
      },
    ],
  },
});
```

**Test Data Strategy:**

- **Factories:** `test/setup/db-factories.ts` for creating consistent, reusable test data entities
- **Fixtures:** Static JSON responses for IGDB API mocks in `test/fixtures/`
- **Builders:** Fluent builder pattern for complex domain objects (e.g., `GameBuilder().withCover().withPlatforms().build()`)

**Coverage Requirements:**

- **Threshold:** ≥80% for branches, functions, lines, statements (enforced in CI)
- **Excluded from coverage:** Next.js app directory, generated Prisma types, config files, test utilities
- **Primary focus:** Service layer business logic and repository data access correctness
- **CI enforcement:** PRs blocked if coverage drops below threshold

**CI/CD Test Integration:**

```yaml
# .github/workflows/pr-checks.yml
- name: Run Unit Tests
  run: pnpm test --project=unit --coverage

- name: Start Test Database
  run: docker-compose up -d

- name: Run Integration Tests
  run: pnpm test --project=integration

- name: Run Component Tests
  run: pnpm test --project=components

- name: Cleanup
  run: docker-compose down
```

**Testing Best Practices:**

- Arrange-Act-Assert pattern for test structure clarity
- Descriptive test names: `it('should return error when game not found in IGDB')`
- Test factories over manual object creation for maintainability
- Integration tests verify repository contracts, not implementation details
- Component tests focus on user interactions, not internal component state

---

## 8. Security Considerations

**Authentication Security:**

- OAuth 2.0 via Google (trusted identity provider)
- NextAuth session tokens stored in httpOnly cookies (prevents XSS attacks)
- CSRF protection built into NextAuth
- Credentials provider restricted to test environments only

**Authorization Enforcement:**

- All mutations require authenticated session validation
- User ID extracted from server-side session (never trusted from client)
- Service layer performs authorization checks before data access
- Row-level security principle: Users can only access their own data

**Data Protection:**

- Environment variables for secrets (never committed to version control)
- `.env.example` provides structure without real credentials
- Database connection strings use SSL in production (RDS enforced encryption)
- S3 bucket policies restrict access to authenticated application roles only

**Input Validation:**

- Zod schemas validate all external input at API boundaries
- Parameterized queries via Prisma (prevents SQL injection)
- next-safe-action middleware enforces validation before business logic

**Dependency Security:**

- Automated dependency updates via Dependabot
- Regular vulnerability scanning in CI pipeline
- Lock files committed (pnpm-lock.yaml) for reproducible builds

---

## Architecture Decision Records

**ADR-001: Why Next.js 15 App Router?**

- Server Components reduce client bundle size for game metadata rendering
- Server Actions provide type-safe mutations without manual API route creation
- Built-in caching and revalidation for optimal performance
- Strong TypeScript integration for full-stack type safety

**ADR-002: Why three-layer architecture (Consumer → Service → Repository)?**

- Enforces separation of concerns via ESLint boundaries
- Service layer centralizes business logic and validation
- Repository layer provides clean abstraction over Prisma
- Prevents scattered authorization checks and Prisma queries throughout app

**ADR-003: Why Result types instead of throwing errors?**

- Explicit error handling paths in TypeScript (no runtime surprises)
- Services return structured `Result<TData, TError>` for predictable error handling
- Reduces try-catch boilerplate in consumers
- Clear contract: success path vs. error path at type level

**ADR-004: Why PostgreSQL over NoSQL?**

- Relational data model (users → library items → games → journal entries)
- Complex queries needed: filter library by status, join journal entries with games
- ACID transactions for data consistency (library updates, journal creation)
- Proven scalability for read-heavy workloads

**ADR-005: Why ECS Fargate over serverless (Lambda)?**

- Next.js Server Components benefit from persistent container context
- Avoids cold start latency for interactive user experience
- Simpler mental model for solo developer (container vs. function lifecycle)
- Database connection pooling more efficient with long-lived containers

**ADR-006: Why LocalStack for local S3?**

- Enables integration testing of file upload flows without AWS costs
- Test environment parity with production S3 API
- Supports CI pipeline testing without external dependencies

---

**Document Metadata:**

- **Version:** 1.0
- **Last Updated:** 2025-10-09
- **Status:** Active
- **Maintained By:** Solo developer with AI assistance
- **Review Cadence:** After each major phase completion
