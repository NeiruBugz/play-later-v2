# Service Pattern Implementation - Task List

## **Slice 1: Enhance BaseService with Authentication Methods**

- [x] Add `getCurrentUserId()` and `getCurrentUserIdOptional()` methods to BaseService
- [x] Update BaseService imports to include authentication utilities
- [x] Add unit tests for new BaseService authentication methods
- [x] Verify existing CollectionService and IgdbService still work with enhanced BaseService

## **Slice 2: Complete GameManagementService Implementation**

- [x] Create `shared/services/game-management/actions/` directory structure
- [x] Move existing `add-to-collection.ts` to new actions directory
- [x] Create `shared/services/game-management/service.ts` with business logic extending BaseService
- [x] Add `types.ts` file for GameManagementService-specific types
- [x] Create comprehensive unit tests for GameManagementService
- [x] Update imports in features to reference new service location

## **Slice 3: Implement UserService with Core User Operations**

- [ ] Create `shared/services/user/` directory structure with actions folder
- [ ] Identify and move user-related server actions from features to `user/actions/`
- [ ] Create `UserService` class with authentication integration and business logic
- [ ] Add user service types in `types.ts`
- [ ] Create unit tests for UserService covering authentication scenarios
- [ ] Update feature imports to use new UserService

## **Slice 4: Implement ReviewService**

- [ ] Create `shared/services/review/` directory structure with actions folder
- [ ] Move review-related server actions to `review/actions/`
- [ ] Create `ReviewService` class with business logic for review operations
- [ ] Add review service types in `types.ts`
- [ ] Create unit tests for ReviewService
- [ ] Update feature imports to reference ReviewService

## **Slice 5: Implement SteamService**

- [ ] Create `shared/services/steam/` directory structure with actions folder
- [ ] Move Steam integration logic from `features/steam-integration/` to `steam/actions/`
- [ ] Create `SteamService` class with authentication and Steam API business logic
- [ ] Add Steam service types in `types.ts`
- [ ] Create unit tests for SteamService with mocked Steam API calls
- [ ] Update Steam feature imports to use new SteamService

## **Slice 6: Implement DashboardService**

- [ ] Create `shared/services/dashboard/` directory structure with actions folder
- [ ] Consolidate dashboard data aggregation logic into `dashboard/actions/`
- [ ] Create `DashboardService` class with user stats and activity business logic
- [ ] Add dashboard service types in `types.ts`
- [ ] Create unit tests for DashboardService
- [ ] Update dashboard feature to use new DashboardService

## **Slice 7: Final Integration and Cleanup**

- [ ] Audit all remaining server actions for proper service integration
- [ ] Update any remaining feature imports to use service pattern
- [ ] Run full test suite to ensure all services work correctly
- [ ] Verify application builds and runs without errors
- [ ] Clean up any unused server action files or import paths

---

**Implementation Notes:**

- Each slice maintains application functionality while building toward complete service architecture
- Services follow the pattern: Consumer → Service → Server Action → Repository
- All services extend BaseService and include comprehensive unit testing
- Authentication is centralized through BaseService methods
- Directory structure follows: `shared/services/[service-name]/[service.ts|actions/|types.ts]`
