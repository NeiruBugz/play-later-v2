# System Architecture Overview: PlayLater

---

## 1. Application & Technology Stack

- **Frontend Framework:** Next.js 15 with App Router
- **UI Library:** React 19 with TypeScript
- **UI Components:** shadcn/ui built on Radix UI primitives
- **Styling:** Tailwind CSS with tailwindcss-animate
- **State Management:** React Server Components + TanStack Query for client state
- **Form Handling:** React Hook Form with Zod validation
- **Package Manager:** pnpm(development and runtime)

---

## 2. Backend & Server Architecture

- **Backend Framework:** Next.js App Router with Server Actions
- **API Architecture:** Type-safe server actions using next-safe-action
- **Business Logic Layer:** Service Layer Pattern (in migration - see [Spec 003](../spec/003-architecture-standardization/))
- **Data Access Pattern:** Repository Pattern with Prisma ORM
- **Runtime Validation:** Zod schemas for type-safe data validation
- **Session Management:** NextAuth.js v5 with JWT strategy
- **File Structure:** Feature-based architecture with shared utilities

### Layered Architecture (Target State)

The application follows a three-tier architecture pattern:

```
┌─────────────────────────────────────────────────────┐
│                   UI Layer                          │
│  (Server/Client Components, Server Actions)         │
│  - Request/response handling                        │
│  - Input sanitization                               │
│  - Calls service layer                              │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                Service Layer                        │
│         (Domain Business Logic)                     │
│  - Business validation                              │
│  - Data transformation                              │
│  - Repository composition                           │
│  - Transaction management                           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Repository Layer                       │
│            (Data Access Only)                       │
│  - Database queries (Prisma)                        │
│  - Type-safe operations                             │
│  - No business logic                                │
└─────────────────────────────────────────────────────┘
```

**Current Status:** In transition to full service layer adoption

- **Complete:** CollectionService (view-collection feature)
- **In Progress:** Architecture standardization across all features
- **Reference:** See [Architecture Standardization Spec](../spec/003-architecture-standardization/)

---

## 3. Data & Persistence

- **Primary Database:** PostgreSQL (Neon Database - managed service)
- **ORM:** Prisma Client with type-safe database access
- **Local Development:** Docker Compose with PostgreSQL 14.5-alpine
- **Data Modeling:** Code-first approach with Prisma schema
- **Migrations:** Prisma Migrate for database schema evolution
- **Connection Pooling:** Built-in Neon connection pooling

---

## 4. Infrastructure & Deployment

- **Cloud Provider:** Vercel (serverless deployment)
- **Hosting Environment:** Vercel Edge Runtime + Node.js functions
- **Database Hosting:** Neon Database (PostgreSQL as a Service)
- **Build System:** Next.js with Turbopack (development)
- **Environment Management:** Vercel environment variables
- **Domain & SSL:** Managed by Vercel platform

---

## 5. External Services & APIs

- **Primary Authentication:** Google OAuth 2.0 (via NextAuth.js)
- **Steam Integration:** Steam OpenID for account linking + Steam Web API
- **Game Metadata:** IGDB API (Internet Game Database)
- **Image Sources:** Direct links from IGDB CDN and Steam CDN
- **Email Provider:** None (OAuth-only authentication)

---

## 6. Security & Compliance

- **Authentication Strategy:** OAuth 2.0 with Google + Steam OpenID linking
- **Session Security:** JWT tokens with 7-day expiration, daily rotation
- **API Security:** Type-safe server actions with Zod validation
- **HTTP Security:** Security headers (X-Frame-Options, CSP, Referrer Policy)
- **Database Security:** Connection strings via environment variables
- **CORS Policy:** Next.js default CORS with specific image domain allowlist

---

## 7. Development & Quality Assurance

- **Testing Framework:** Vitest with separate unit/integration configurations
- **Code Quality:** ESLint with TypeScript, Prettier for formatting
- **Type Safety:** End-to-end TypeScript with strict configuration
- **Git Workflow:** Conventional Commits with commitlint
- **Database Testing:** Separate test database with Docker setup
- **Coverage:** Vitest coverage reports with configurable thresholds

---

## 8. Observability & Monitoring

- **Logging:** Vercel Function Logs (built-in platform logging)
- **Error Tracking:** Console-based error logging (no external service)
- **Performance Monitoring:** Vercel Analytics (basic performance metrics)
- **Uptime Monitoring:** Vercel platform monitoring
- **Database Monitoring:** Neon Database built-in monitoring dashboard

---

## 9. Data Flow & Integration Patterns

- **User Authentication Flow:** Google OAuth → NextAuth.js → Prisma User Creation
- **Steam Integration Flow:** Steam OpenID → Link to existing user → Import library via Steam Web API
- **Game Data Flow:** IGDB API → Local caching → User collection management
- **Review System Flow:** User input → Zod validation → Prisma storage → Community display
- **Wishlist Sharing:** Generate unique URLs → Public read-only access → Social sharing

---

## 10. Scalability & Performance Considerations

- **Database Indexing:** Strategic indexes on user queries (userId, status, platform, gameId)
- **API Rate Limiting:** Dependent on external service limits (IGDB, Steam)
- **Image Optimization:** Next.js Image component with remote pattern allowlist
- **Caching Strategy:** Browser caching for static assets, no server-side caching implemented
- **Database Connections:** Neon's built-in connection pooling for serverless functions

---

## 11. Service Layer Architecture

### Overview

The service layer encapsulates business logic between the UI layer (server actions) and the repository layer (data access). This provides a clean separation of concerns and enables comprehensive testing of business logic.

**Status:** In active migration - see [Architecture Standardization Spec](../spec/003-architecture-standardization/)

### Service Layer Structure

```
shared/services/
├── library/                    # Library item operations
│   ├── library-service.ts     # Service implementation
│   ├── library-service.test.ts # Unit tests
│   ├── types.ts               # Service-specific types
│   └── index.ts               # Public exports
├── game/                       # Game operations
├── review/                     # Review management
├── user/                       # User operations
├── journal/                    # Journal entries
└── index.ts                    # Barrel exports
```

### Service Responsibilities

**Services SHOULD:**

- ✅ Contain business logic and domain rules
- ✅ Validate input data (beyond basic type checking)
- ✅ Transform data between layers
- ✅ Compose multiple repository calls
- ✅ Handle transactions and error scenarios
- ✅ Return consistent response formats

**Services SHOULD NOT:**

- ❌ Handle HTTP concerns (request/response)
- ❌ Contain UI logic
- ❌ Directly access database (use repositories)
- ❌ Have side effects without explicit intent

### Service Integration Pattern

```typescript
// Service Layer (Business Logic)
export class LibraryService {
  async createLibraryItem(input: CreateInput): Promise<ServiceResult> {
    // Validation, transformation, repository calls
    const item = await createLibraryItem({ ... });
    return { success: true, data: { item } };
  }
}

// Server Action (Thin Wrapper)
export const createLibraryItemAction = authorizedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await libraryService.createLibraryItem({
      userId,
      ...parsedInput
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  });
```

### Core Services

1. **LibraryService** (`shared/services/library/`)
   - Library item CRUD operations
   - Status management and filtering
   - Multi-platform support

2. **GameService** (`shared/services/game/`)
   - Game CRUD operations
   - IGDB integration wrapper
   - Search functionality

3. **ReviewService** (`shared/services/review/`)
   - Review CRUD operations
   - Rating aggregation

4. **UserService** (`shared/services/user/`)
   - User profile operations
   - Steam integration management

5. **JournalService** (`shared/services/journal/`)
   - Journal entry CRUD
   - Mood and session tracking

### Testing Strategy

**Service Layer Testing:**

- > 90% unit test coverage requirement
- Mocked repository dependencies
- Comprehensive error scenario coverage
- Business logic validation

**Integration Testing:**

- Server actions with real services
- Service composition testing
- End-to-end flow validation

### Migration Status

**Implemented:**

- ✅ CollectionService (view-collection feature)
- ✅ Architecture specification complete

**In Progress:**

- 🔄 Core services implementation (LibraryService, GameService, etc.)
- 🔄 Feature-by-feature migration

**Target Completion:** 6-7 weeks from start date

**Documentation:**

- [Architecture Standardization Spec](../spec/003-architecture-standardization/) - Complete specification
- [Functional Spec](../spec/003-architecture-standardization/functional-spec.md) - Business requirements
- [Technical Spec](../spec/003-architecture-standardization/technical-considerations.md) - Implementation details
- [Task List](../spec/003-architecture-standardization/tasks.md) - Execution plan
