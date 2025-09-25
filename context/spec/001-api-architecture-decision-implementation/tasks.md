# API Architecture Decision & Implementation - Task List

## **Phase 1: Research & Foundation Setup**

- [x] **Slice 1: Architecture Research & Documentation**
  - [x] Research and document hybrid approach vs full Route Handlers migration with case studies from similar Next.js applications
  - [x] Create time estimates for both approaches and document final decision rationale
  - [x] Update technical specification with final architectural decision
  - [x] Set up basic API testing infrastructure (test utilities, shared types)

## **Phase 2: Service Layer Foundation**

- [x] **Slice 2: Basic Service Layer Infrastructure**

  - [x] Create shared service base class with ServiceResult<T> type definition
  - [x] Set up service layer directory structure (`shared/services/`)
  - [x] Create authentication middleware utility for Route Handlers
  - [x] Add basic error handling patterns for API routes

- [ ] **Slice 3: Dashboard Service Implementation**
  - [ ] Create `DashboardService` class with methods for collection stats, recent activity, and upcoming releases
  - [ ] Add comprehensive unit tests for DashboardService with mocked repository dependencies
  - [ ] Verify service integrates correctly with existing repository layer
  - [ ] Service returns identical data structures to current server actions

## **Phase 3: Dashboard API Migration (Simplest)**

- [ ] **Slice 4: Dashboard Stats API Endpoint**

  - [ ] Create `GET /api/dashboard/stats` Route Handler using DashboardService
  - [ ] Include authentication middleware and error handling
  - [ ] Add integration tests verifying identical response to existing server actions
  - [ ] API endpoint is functional and returns correct data

- [ ] **Slice 5: Dashboard Recent Activity API Endpoint**

  - [ ] Create `GET /api/dashboard/recent` Route Handler for recent completed items
  - [ ] Add comprehensive error handling and input validation
  - [ ] Create integration tests comparing old vs new data responses
  - [ ] Verify endpoint works correctly with authentication

- [ ] **Slice 6: Dashboard Upcoming Releases API Endpoint**
  - [ ] Create `GET /api/dashboard/upcoming` Route Handler for upcoming wishlist items
  - [ ] Implement proper caching strategy with Next.js revalidation
  - [ ] Add performance tests comparing Route Handler vs Server Action response times
  - [ ] Endpoint delivers correct data with proper caching

## **Phase 4: Dashboard Web App Migration**

- [ ] **Slice 7: Migrate BacklogCount Component**

  - [ ] Update `BacklogCount` component to fetch from `/api/dashboard/stats` using simple fetch
  - [ ] Implement proper loading states and error handling
  - [ ] Add before/after functional testing to ensure identical user experience
  - [ ] Component works identically to server action version

- [ ] **Slice 8: Migrate PlatformBreakdown Component**

  - [ ] Update `PlatformBreakdown` component to use `/api/dashboard/stats` endpoint
  - [ ] Maintain identical data display and user interaction behavior
  - [ ] Verify caching behavior and performance meets requirements
  - [ ] Component delivers same functionality as before

- [ ] **Slice 9: Migrate RecentActivity & UpcomingReleases Components**
  - [ ] Update both components to use their respective API endpoints
  - [ ] Implement consistent error handling across all dashboard components
  - [ ] Add end-to-end testing for complete dashboard functionality
  - [ ] Dashboard page works identically with new API architecture

## **Phase 5: Collection Service & API Foundation**

- [ ] **Slice 10: Collection Service Implementation**

  - [ ] Extend existing `CollectionService` to handle all collection-related operations
  - [ ] Add methods for platforms, backlogs, and wishlist data
  - [ ] Create comprehensive unit tests with >90% coverage
  - [ ] Service properly integrates with existing repository layer

- [ ] **Slice 11: Collection API Endpoints**
  - [ ] Create `GET /api/collection` Route Handler for paginated collection data
  - [ ] Create `GET /api/collection/platforms` Route Handler for platform filter options
  - [ ] Add input validation using existing FilterParamsSchema
  - [ ] Endpoints return identical data structures to current server actions

## **Phase 6: Collection Web App Migration (Complex)**

- [ ] **Slice 12: TanStack Query Integration Setup**

  - [ ] Install and configure TanStack Query for the application
  - [ ] Create `useCollectionQuery` hook for collection data with caching
  - [ ] Set up proper query keys and caching strategies
  - [ ] Hook is ready for component integration

- [ ] **Slice 13: Migrate CollectionList Component**

  - [ ] Update `CollectionList` to use `useCollectionQuery` hook
  - [ ] Maintain all existing filtering, pagination, and view mode functionality
  - [ ] Ensure loading states and error handling work identically
  - [ ] Collection page works exactly as before with better caching

- [ ] **Slice 14: Migrate CollectionFilters Component**
  - [ ] Update platform filter to use `/api/collection/platforms` endpoint
  - [ ] Maintain all existing filter functionality and URL state management
  - [ ] Verify all filter combinations work correctly with new API
  - [ ] Filtering experience remains identical for users

## **Phase 7: Game & Review Services**

- [ ] **Slice 15: Game & Review Service Implementation**

  - [ ] Create `GameService` for game details and related operations
  - [ ] Create `ReviewService` for review CRUD operations
  - [ ] Add comprehensive unit tests for both services
  - [ ] Services integrate properly with repository layer

- [ ] **Slice 16: Game & Review API Endpoints**
  - [ ] Create `GET /api/games/{id}` Route Handler for game details
  - [ ] Create `GET /api/games/{id}/reviews` Route Handler for game reviews
  - [ ] Add proper parameter validation and error handling
  - [ ] Endpoints return data identical to existing server actions

## **Phase 8: IGDB Service Migration**

- [ ] **Slice 17: IGDB Service Implementation**

  - [ ] Create `IGDBService` class centralizing all IGDB API interactions
  - [ ] Identify and catalog all existing direct IGDB API calls in codebase
  - [ ] Implement rate limiting and error handling in service layer
  - [ ] Service provides consistent interface for IGDB operations

- [ ] **Slice 18: IGDB API Endpoints & Migration**
  - [ ] Create `GET /api/igdb/search` and `GET /api/igdb/games/{id}` Route Handlers
  - [ ] Gradually migrate existing direct IGDB calls to use IGDBService
  - [ ] Maintain backward compatibility during migration period
  - [ ] All IGDB operations go through centralized service

## **Phase 9: Testing & Documentation**

- [ ] **Slice 19: Comprehensive Testing Suite**

  - [ ] Create integration tests covering all new API endpoints
  - [ ] Add performance regression tests comparing old vs new approaches
  - [ ] Implement rollback testing procedures for migration safety
  - [ ] All tests pass and validate migration success

- [ ] **Slice 20: OpenAPI Documentation**
  - [ ] Install and configure OpenAPI documentation generation tools
  - [ ] Generate comprehensive API documentation from Route Handler implementations
  - [ ] Verify documentation accuracy with example requests/responses
  - [ ] Documentation is ready for mobile development team

## **Phase 10: Final Migration & Cleanup**

- [ ] **Slice 21: Complete Web App Migration Validation**

  - [ ] Conduct end-to-end testing of all migrated functionality
  - [ ] Verify identical user experience across all features
  - [ ] Measure and validate performance meets or exceeds previous benchmarks
  - [ ] Web application works identically to pre-migration state

- [ ] **Slice 22: Migration Cleanup & Optimization**
  - [ ] Remove unused Server Actions that have been successfully migrated
  - [ ] Optimize caching strategies based on real usage patterns
  - [ ] Document migration lessons learned and architectural decisions
  - [ ] API architecture is ready for mobile application development
