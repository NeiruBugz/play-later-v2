# Specification 003: Architecture Standardization & Service Layer Implementation

**Status:** Draft
**Priority:** High
**Estimated Effort:** 80-110 hours (6-7 weeks)
**Target Start:** TBD
**Owner:** Architecture Team

---

## Quick Links

- 📋 [Functional Specification](./functional-spec.md) - What we're building and why
- 🔧 [Technical Considerations](./technical-considerations.md) - How we'll build it
- ✅ [Implementation Tasks](./tasks.md) - Step-by-step execution plan

---

## Executive Summary

### Problem

The PlayLater application has architectural inconsistencies despite having established patterns:
- Mixed service layer adoption (some features use it, others don't)
- Business logic scattered across server actions
- Inconsistent directory structures and validation approaches
- Direct repository calls from some server actions

### Solution

Implement a standardized **Consumer → Service → Repository** architecture across all features:

```
UI Components → Server Actions → Service Layer → Repository Layer → Database
                (thin wrappers)   (business logic)  (data access)
```

### Benefits

1. **Developer Productivity:** Consistent patterns reduce cognitive load
2. **Code Maintainability:** Clear separation of concerns
3. **Testing Coverage:** Service layer enables isolated unit testing
4. **Scalability:** Well-defined layers support future growth
5. **Code Reusability:** Shared business logic across features

---

## What's Included

### Phase 1: Foundation (Week 1)
- Architecture documentation updates
- Service layer templates and standards
- Testing infrastructure
- Migration guides

### Phase 2: Core Services (Week 2-3)
- **LibraryService** - Library item operations
- **GameService** - Game CRUD and search
- **ReviewService** - Review management
- **UserService** - User operations
- **JournalService** - Journal entries

All with >90% test coverage

### Phase 3: Feature Migration (Week 4-6)
Refactor all features to use service layer:
- manage-library-item
- add-game
- dashboard
- view-game-details
- view-collection
- And 7 more features

### Phase 4: Testing & Documentation (Week 7)
- Comprehensive testing (>80% overall coverage)
- Code quality verification
- Documentation updates
- Performance benchmarking

---

## Key Metrics

### Success Criteria
- ✅ All features use service layer
- ✅ >90% service test coverage
- ✅ >80% overall test coverage
- ✅ Zero TypeScript errors
- ✅ No performance regression

### Current vs Target

| Metric | Current | Target |
|--------|---------|--------|
| Service Layer Adoption | 1/17 features | 17/17 features |
| Test Coverage (Services) | N/A | >90% |
| Consistent Architecture | Inconsistent | Fully standardized |
| Business Logic Location | Server Actions | Service Layer |
| Direct Repository Calls | Common | Zero |

---

## Technical Approach

### Three-Layer Architecture

**1. UI Layer (Server Actions)**
- Input sanitization
- Authentication checks
- Minimal business logic
- Calls service layer

**2. Service Layer (Business Logic)**
- Domain logic and validation
- Data transformation
- Composition of operations
- Transaction management
- Error handling

**3. Repository Layer (Data Access)**
- Database queries (Prisma)
- No business logic
- Type-safe operations
- Query optimization

### Service Example

```typescript
// Service Layer
export class LibraryService {
  async createLibraryItem(input: CreateLibraryItemInput): Promise<ServiceResult> {
    // Validation
    this.validateInput(input);

    // Business logic
    const item = await createLibraryItem({
      libraryItem: {
        status: input.status ?? LibraryItemStatus.CURIOUS_ABOUT,
        platform: input.platform,
        // ...
      },
      userId: input.userId,
      gameId: input.gameId,
    });

    // Transform and return
    return {
      success: true,
      data: { item: this.transformLibraryItem(item) }
    };
  }
}

// Server Action (thin wrapper)
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

---

## Risk Assessment

### Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes during refactor | High | Medium | Incremental rollout, comprehensive testing |
| Team learning curve | Low | Low | Documentation, templates, pair programming |
| Performance regression | Low | Low | Benchmarking, monitoring |
| Test coverage gaps | Medium | Medium | >80% coverage requirement, CI/CD gates |

### Rollback Strategy

- Feature-by-feature migration (can rollback individually)
- Service layer is additive (no destructive changes)
- Git branches per feature refactor
- Feature flags for gradual rollout (optional)

---

## Timeline & Milestones

### Week 1: Foundation
- **Milestone:** Documentation and infrastructure complete
- **Deliverable:** Service templates, testing utilities, migration guide

### Weeks 2-3: Core Services
- **Milestone:** All 5 core services implemented and tested
- **Deliverable:** LibraryService, GameService, ReviewService, UserService, JournalService

### Weeks 4-6: Feature Migration
- **Milestone:** All 17 features using service layer
- **Deliverable:** Refactored features with updated tests and documentation

### Week 7: Quality Assurance
- **Milestone:** Production ready
- **Deliverable:** >80% coverage, zero errors, performance verified

---

## Dependencies

### Prerequisites
- Current repository pattern working (✅ Complete)
- Feature-based architecture in place (✅ Complete)
- Testing infrastructure available (✅ Complete)

### Blockers
- None identified

### External Dependencies
- No new external services or libraries required
- Uses existing stack (Next.js, Prisma, TypeScript)

---

## Team Impact

### Developer Experience
- **Initial:** Learning curve for service pattern (~1 week)
- **Ongoing:** Faster development with clear patterns
- **Onboarding:** Easier for new developers (consistent structure)

### Required Skills
- TypeScript (intermediate)
- Testing (unit and integration)
- Next.js patterns (existing knowledge)
- Repository pattern (existing knowledge)

### Training Plan
- Architecture overview session (2 hours)
- Service layer workshop (4 hours)
- Pair programming for first feature (8 hours)
- Office hours for questions (ongoing)

---

## Success Metrics

### Quantitative
- Service layer test coverage: >90%
- Feature refactoring completion: 100%
- TypeScript errors: 0
- Build errors: 0
- Performance regression: <5%

### Qualitative
- Developer satisfaction with architecture
- Reduced time to implement new features
- Fewer bugs related to business logic
- Positive code review feedback

---

## Next Steps

1. **Review and Approve:** Review this specification with team
2. **Schedule Work:** Allocate resources and timeline
3. **Start Foundation:** Begin with Phase 1 (documentation and templates)
4. **Iterate:** Gather feedback after first service and feature migration

---

## Questions & Decisions

### Open Questions
- [ ] Should we use feature flags for gradual rollout?
- [ ] Do we need performance regression testing in CI/CD?
- [ ] Should we create video tutorials for service patterns?

### Decisions Made
- ✅ Full service layer adoption (not just complex features)
- ✅ Validation split: input in server actions, business in services
- ✅ Repositories stay focused on data access only
- ✅ Features maintain independence with explicit exports

---

## References

### Related Documents
- [Architecture Overview](../../product/architecture.md)
- [Repository Pattern Implementation](../002-savepoint-database-migration/)
- [Feature Documentation](../../../features/)

### External Resources
- [Next.js Data Access Layer Pattern](https://nextjs.org/docs)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Feature-Driven Architecture](https://dev.to/rufatalv/feature-driven-architecture-with-nextjs-a-better-way-to-structure-your-application-1lph)

### Example Implementation
- View Collection Feature (already uses service layer)
  - Service: `shared/services/collection/collection-service.ts`
  - Tests: `shared/services/collection/collection-service.test.ts`
  - Integration: `features/view-collection/server-actions/`

---

**Last Updated:** 2025-10-03
**Document Owner:** Architecture Team
**Next Review:** After Phase 2 completion
