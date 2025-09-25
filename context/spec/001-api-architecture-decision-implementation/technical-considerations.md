# Technical Specification: API Architecture Decision & Implementation

- **Functional Specification:** [context/spec/001-api-architecture-decision-implementation/functional-spec.md]
- **Status:** Final - Architecture Decision Approved
- **Author(s):** Technical Architect

---

## 0. Final Architecture Decision

**Decision**: **Hybrid Migration Approach** - Approved September 25, 2025

Based on comprehensive research and analysis (detailed in [architecture-research.md](./architecture-research.md)), we have selected the hybrid migration approach over a full Route Handlers migration.

### Key Decision Factors:

- **Development Timeline**: 6-10 weeks vs 12-16 weeks for full migration
- **Risk Level**: Low risk with incremental migration phases
- **Existing Architecture**: Builds upon proven `CollectionService` pattern
- **Mobile Enablement**: Achieves 80% of mobile development requirements with minimal disruption

### Implementation Priority:

1. **Service Layer Expansion**: Extend existing service pattern to all domains
2. **Selective Route Handler Migration**: Convert GET operations with caching/filtering benefits
3. **Server Actions Retention**: Maintain for mutations and internal operations
4. **IGDB Service Centralization**: Consolidate external API calls

**Detailed Research & Decision Matrix**: See [architecture-research.md](./architecture-research.md) for comprehensive analysis, case studies, and implementation timeline.

---

## 1. High-Level Technical Approach

Based on the existing Next.js 15 architecture with Server Actions and partial Route Handler implementation, we will implement a **hybrid migration approach** that:

1. **Extends Service Layer**: Build upon existing `CollectionService` pattern for all business domains
2. **Migrates GET Operations**: Convert existing GET Server Actions to Route Handlers for better caching and mobile compatibility
3. **Implements Client-Side Fetching**: Replace Server Action calls with `fetch()` or TanStack Query where filtering benefits exist
4. **Maintains Compatibility**: Ensure identical data structures and error handling for seamless web app operation
5. **Gradual IGDB Migration**: Introduce `IGDBService` and incrementally migrate direct IGDB API calls

This approach leverages existing architectural patterns while enabling mobile app development and improving web app caching capabilities.

---

## 2. Proposed Solution & Implementation Plan

### Architecture Changes

#### Service Layer Expansion

**New Service Classes** (following existing `CollectionService` pattern):

```typescript
// shared/services/igdb/igdb-service.ts
class IGDBService {
  async searchGames(query: string): Promise<ServiceResult<IGDBGame[]>>;
  async getGameDetails(igdbId: number): Promise<ServiceResult<IGDBGame>>;
  async getPlatforms(): Promise<ServiceResult<IGDBPlatform[]>>;
}

// shared/services/user/user-service.ts
class UserService {
  async getUserProfile(userId: string): Promise<ServiceResult<UserProfile>>;
  async updateUserProfile(
    userId: string,
    data: UpdateUserData
  ): Promise<ServiceResult<User>>;
}

// shared/services/review/review-service.ts
class ReviewService {
  async getReviews(filters: ReviewFilters): Promise<ServiceResult<Review[]>>;
  async createReview(
    userId: string,
    data: CreateReviewData
  ): Promise<ServiceResult<Review>>;
}

// shared/services/dashboard/dashboard-service.ts
class DashboardService {
  async getCollectionStats(
    userId: string
  ): Promise<ServiceResult<CollectionStats>>;
  async getRecentActivity(
    userId: string
  ): Promise<ServiceResult<RecentActivity[]>>;
  async getPlatformBreakdown(
    userId: string
  ): Promise<ServiceResult<PlatformBreakdown>>;
}

// shared/services/steam/steam-service.ts
class SteamService {
  async importSteamLibrary(
    userId: string,
    steamId: string
  ): Promise<ServiceResult<ImportResult>>;
  async getSteamAchievements(
    userId: string,
    appId: number
  ): Promise<ServiceResult<Achievement[]>>;
}
```

**Service Integration Pattern**:
All services follow the existing pattern with:

- Dependency injection for repository layer
- Consistent error handling with `ServiceResult<T>` type
- Input validation with Zod schemas
- Comprehensive unit test coverage

#### API Route Implementation

**Route Handler Structure** (extending existing `/api/collection/route.ts` pattern):

```typescript
// Phase 1: Dashboard Routes (Easier migration)
GET / api / dashboard / stats; // Replace get-backlog-items-count, get-platform-breakdown
GET / api / dashboard / recent; // Replace get-recent-completed-backlog-items
GET / api / dashboard / upcoming; // Replace get-upcoming-wishlist-items

// Phase 2: Collection Routes
GET / api / collection; // Replace getUserGamesWithGroupedBacklogPaginated
GET / api / collection / platforms; // Replace get-uniques-platforms
GET / api / backlogs; // Replace getBacklogs
GET / api / wishlist; // Replace getWishlistedItems

// Phase 3: Game & Review Routes
GET / api / games / { id }; // Replace getGame
GET / api / games / { id } / reviews; // Replace getReviews
GET / api / games / { id } / backlog - items; // Replace getBacklogItemsByIgdbId

// Phase 4: IGDB Integration Routes
GET / api / igdb / search; // Centralize IGDB search through IGDBService
GET / api / igdb / games / { id }; // Centralize IGDB game details
```

**Authentication Middleware**:

```typescript
// shared/lib/api/auth-middleware.ts
async function authenticateRequest(
  request: NextRequest
): Promise<string | null> {
  // Current: Check NextAuth session
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  // Future: JWT token support for mobile (Phase 2)
  // const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  // if (token) return validateJWTToken(token);

  return null;
}
```

### Component Migration Strategy

#### Client-Side Data Fetching Implementation

**TanStack Query Integration** (for filtering-heavy components):

```typescript
// features/view-collection/hooks/use-collection-query.ts
export function useCollectionQuery(filters: FilterParams) {
  return useQuery({
    queryKey: ["collection", filters],
    queryFn: () =>
      fetch(`/api/collection?${new URLSearchParams(filters)}`).then((res) =>
        res.json()
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Usage in CollectionList component
const { data, error, isLoading } = useCollectionQuery({
  platform: searchParams.get("platform"),
  status: searchParams.get("status"),
  search: searchParams.get("search"),
  page: Number(searchParams.get("page")) || 1,
});
```

**Simple Fetch Integration** (for dashboard components):

```typescript
// features/dashboard/components/collection-stats.tsx
async function CollectionStats() {
  const stats = await fetch('/api/dashboard/stats', {
    next: { revalidate: 300 } // 5 minute cache
  }).then(res => res.json());

  return <StatsDisplay stats={stats} />;
}
```

#### Migration Priority and Phases

**Phase 1: Dashboard Components** (Easiest migration, no filtering complexity):

- `BacklogCount` → `GET /api/dashboard/stats`
- `PlatformBreakdown` → `GET /api/dashboard/stats`
- `RecentActivity` → `GET /api/dashboard/recent`
- `UpcomingReleases` → `GET /api/dashboard/upcoming`

**Phase 2: Collection Components** (TanStack Query benefits):

- `CollectionList` → `GET /api/collection` with TanStack Query
- `CollectionFilters` → `GET /api/collection/platforms`

**Phase 3: Game Detail Components**:

- `GameDetails` → `GET /api/games/{id}`
- `GameReviews` → `GET /api/games/{id}/reviews`

**Phase 4: IGDB Service Migration**:

- Identify all direct IGDB API calls in codebase
- Replace with `IGDBService` methods
- Update Route Handlers to use centralized service

### Data Model / Database Changes

**No Database Schema Changes Required**: All Route Handlers will return identical data structures to existing Server Actions to maintain web app compatibility.

**Service Result Type** (extend existing pattern):

```typescript
type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

### API Contracts

#### Error Handling Standardization

**Route Handler Error Response Format** (matching existing Server Action patterns):

```typescript
// Success Response
{ success: true, data: T }

// Error Response
{ success: false, error: string, cause?: unknown }

// HTTP Status Codes
200: Success with data
400: Invalid request parameters
401: Authentication required
404: Resource not found
500: Internal server error
```

#### Request/Response Examples

**GET /api/collection**:

```typescript
// Request Query Parameters
interface CollectionParams {
  platform?: string;
  status?: BacklogItemStatus;
  search?: string;
  page?: number;
}

// Response (identical to current Server Action)
interface CollectionResponse {
  success: true;
  data: {
    collection: GameWithBacklogItems[];
    totalCount: number;
    currentPage: number;
  };
}
```

---

## 3. Impact and Risk Analysis

### System Dependencies

**Affected Components**:

- All components currently using GET Server Actions for data fetching
- Dashboard components: `BacklogCount`, `PlatformBreakdown`, `RecentActivity`, `UpcomingReleases`
- Collection components: `CollectionList`, `GameDetails`
- Review components: `ReviewList`, `GameReviews`

**New Dependencies**:

- TanStack Query for client-side data fetching (collection filtering)
- Service layer expansion for business logic abstraction
- OpenAPI tooling for documentation generation

### Potential Risks & Mitigations

#### **Risk: Web App Performance Regression**

- **Mitigation**: Implement proper caching strategies (`next: { revalidate }` for fetch, TanStack Query cache config)
- **Monitoring**: Compare response times before/after migration
- **Rollback Plan**: Keep existing Server Actions until migration is fully validated

#### **Risk: Breaking Changes During Migration**

- **Mitigation**: Phase-by-phase migration starting with dashboard (lowest complexity)
- **Testing**: Comprehensive integration tests comparing old vs new behavior
- **Compatibility**: Maintain identical data structures and error formats

#### **Risk: Authentication Complexity**

- **Mitigation**: Start with existing NextAuth session validation only
- **Future Planning**: Design JWT token support for mobile phase
- **Isolation**: Keep authentication logic in shared middleware

#### **Risk: IGDB Service Migration Complexity**

- **Mitigation**: Identify all IGDB calls first, migrate incrementally
- **Backward Compatibility**: Keep existing direct calls until service is fully tested
- **Rate Limiting**: Centralize IGDB rate limiting in service layer

#### **Risk: Development Time Underestimation**

- **Mitigation**: Start with dashboard components (simplest migration)
- **Documentation**: Maintain detailed migration progress tracking
- **Validation**: Test each phase thoroughly before proceeding

---

## 4. Testing Strategy

### Unit Testing

**Service Layer Tests**:

- All new service classes with comprehensive coverage (>90%)
- Mock repository dependencies for isolated testing
- Error scenario coverage for all service methods

**Route Handler Tests**:

- HTTP request/response validation
- Authentication middleware testing
- Error handling and status code verification
- Input validation with edge cases

### Integration Testing

**API Integration Tests**:

- End-to-end Route Handler functionality
- Service layer integration with repository layer
- Database interaction verification through test database

**Component Migration Tests**:

- Before/after comparison for each migrated component
- Data structure validation (ensure identical responses)
- Error handling behavior verification
- Loading state and caching behavior

### Migration Validation

**Functional Testing**:

- Complete user workflow testing after each migration phase
- Cross-browser compatibility verification
- Mobile responsiveness validation (prep for mobile app)

**Performance Testing**:

- Response time comparison (Server Actions vs Route Handlers)
- Caching effectiveness measurement
- Memory usage and bundle size impact analysis

**Rollback Testing**:

- Ability to revert to Server Actions if issues arise
- Data consistency verification during rollback scenarios

### OpenAPI Documentation Testing

**Documentation Validation**:

- Generated OpenAPI schema accuracy
- Example request/response verification
- Type generation testing for future mobile development

This comprehensive testing strategy ensures migration safety while validating the foundation for future mobile app development.
