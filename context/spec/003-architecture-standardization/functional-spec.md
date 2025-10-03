# Functional Specification: Architecture Standardization & Service Layer Implementation

**Status:** Draft
**Author:** Architecture Team
**Created:** 2025-10-03
**Related Documents:**
- [Technical Considerations](./technical-considerations.md)
- [Implementation Tasks](./tasks.md)
- [Architecture Overview](../../product/architecture.md)

---

## 1. Executive Summary

### Problem Statement

The PlayLater application currently exhibits architectural inconsistencies across features despite having established patterns like the repository pattern and feature-based architecture. This inconsistency manifests in:

1. **Mixed Service Layer Adoption**: Some features (view-collection) implement a service layer while others call repositories directly from server actions
2. **Varied Server Action Patterns**: Inconsistent levels of business logic in server actions
3. **Disparate Validation Approaches**: Different locations for validation schemas (`/lib/validation.ts` vs `/server-actions/schema.ts`)
4. **Inconsistent Directory Structures**: Features have different subdirectory organizations (`/lib`, `/hooks`, `/validation`)

### Proposed Solution

Establish and implement a standardized **Consumer → Service → Repository** architecture pattern across all features, aligning with Next.js 2025 best practices and the Data Access Layer pattern recommended by Vercel.

### Business Value

- **Developer Productivity**: Consistent patterns reduce cognitive load and onboarding time
- **Code Maintainability**: Clear separation of concerns makes bugs easier to isolate and fix
- **Testing Coverage**: Service layer enables comprehensive unit testing of business logic
- **Scalability**: Well-defined layers support future growth and feature additions
- **Code Reusability**: Service layer logic can be shared across server actions and API routes

---

## 2. Current Architecture Analysis

### 2.1 Current State Assessment

#### Strengths ✅
- **Repository Pattern**: Successfully implemented for data access abstraction
- **Feature-Based Architecture**: Logical organization around business capabilities
- **Type Safety**: Comprehensive TypeScript usage with Zod validation
- **Modern Stack**: Next.js 15, Prisma, React Server Components
- **Documentation**: Excellent feature-level documentation in CLAUDE.md files

#### Inconsistencies ⚠️

**1. Service Layer Inconsistency**

**Example: view-collection (HAS service layer)**
```
server-action → CollectionService → Repository → Prisma
```

**Example: manage-library-item (NO service layer)**
```
server-action → Repository → Prisma
```

**2. Business Logic Placement**

Some server actions contain complex business logic:
```typescript
// dashboard/server-actions/get-backlog-items-count.ts
.action(async ({ parsedInput, ctx: { userId } }) => {
  if (!parsedInput?.status) {
    return getLibraryCount({ userId });
  }
  // Complex conditional logic here...
});
```

Others are simple pass-throughs:
```typescript
// view-collection/server-actions/get-game-with-backlog-items.ts
.action(async ({ ctx: { userId }, parsedInput }) => {
  const result = await collectionService.getCollection({...});
  return result.data;
});
```

**3. Directory Structure Variations**

```
features/manage-library-item/
├── components/
├── server-actions/
├── lib/           # Some features have this
├── hooks/         # Some features have this
├── types/
└── index.ts

features/add-game/
├── components/
├── server-actions/
├── lib/           # Has validation here
├── types/
└── index.ts

features/view-imported-games/
├── components/
├── server-actions/
├── validation/    # Has validation in separate dir
└── index.ts
```

### 2.2 Industry Research Findings

Based on comprehensive research of production Next.js applications (2025):

#### Recommended Pattern: Data Access Layer
- **Source**: Next.js official documentation, Vercel engineering blog
- **Pattern**: Centralized business logic layer between UI and database
- **Benefits**: Consistent data access, reduced authorization bugs, easier testing

#### Service Layer Pattern
- **Adoption**: Widely used in production Next.js apps with Prisma
- **Structure**: Services call repositories, server actions call services
- **Testing**: Enables isolated unit testing of business logic

#### Feature-Driven Architecture
- **Best Practice**: Features should be independent with explicit APIs
- **Communication**: Cross-feature dependencies use public exports via index.ts
- **Colocation**: Related code lives together regardless of technical type

---

## 3. Target Architecture

### 3.1 Three-Layer Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│                   UI Layer                          │
│  (Server/Client Components, Server Actions)         │
│                                                     │
│  - Handles request/response                         │
│  - Input sanitization                               │
│  - Minimal business logic                           │
│  - Calls service layer                              │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                Service Layer                        │
│         (Domain Business Logic)                     │
│                                                     │
│  - Business logic & validation                      │
│  - Data transformation                              │
│  - Composition of repository calls                  │
│  - Transaction management                           │
│  - Error handling                                   │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Repository Layer                       │
│            (Data Access Only)                       │
│                                                     │
│  - Database queries (Prisma)                        │
│  - No business logic                                │
│  - Type-safe data operations                        │
│  - Query optimization                               │
└─────────────────────────────────────────────────────┘
```

### 3.2 Standardized Feature Structure

```
features/[feature-name]/
├── components/              # React components (Server/Client)
│   ├── [feature]-form.tsx
│   ├── [feature]-list.tsx
│   └── index.ts
├── server-actions/          # Next.js server actions (thin wrappers)
│   ├── [action-name].ts
│   ├── [action-name].test.ts
│   └── index.ts
├── hooks/                   # Client-side React hooks (if needed)
│   └── use-[feature].ts
├── lib/                     # Feature-specific utilities
│   ├── validation.ts        # Zod schemas for this feature
│   ├── utils.ts            # Helper functions
│   └── constants.ts
├── types/                   # TypeScript definitions
│   └── index.ts
├── CLAUDE.md               # Feature documentation
└── index.ts                # Public API exports
```

### 3.3 Shared Services Structure

```
shared/services/
├── library/                 # Library item operations
│   ├── library-service.ts
│   ├── library-service.test.ts
│   ├── types.ts
│   └── index.ts
├── game/                    # Game CRUD operations
│   ├── game-service.ts
│   ├── game-service.test.ts
│   ├── types.ts
│   └── index.ts
├── review/                  # Review management
│   ├── review-service.ts
│   ├── review-service.test.ts
│   ├── types.ts
│   └── index.ts
├── user/                    # User operations
│   ├── user-service.ts
│   ├── user-service.test.ts
│   ├── types.ts
│   └── index.ts
├── journal/                 # Journal entries
│   ├── journal-service.ts
│   ├── journal-service.test.ts
│   ├── types.ts
│   └── index.ts
└── index.ts                # Service exports
```

---

## 4. Service Layer Design Principles

### 4.1 Service Responsibilities

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

### 4.2 Standard Service Pattern

```typescript
// shared/services/library/library-service.ts
import { LibraryRepository } from '@/shared/lib/repository';
import type { ServiceResult, LibraryServiceInput } from './types';

export class LibraryService {
  constructor(private libraryRepo = new LibraryRepository()) {}

  async getLibraryItems(input: LibraryServiceInput): Promise<ServiceResult> {
    // 1. Validate input
    const validatedInput = this.validateInput(input);

    // 2. Business logic
    const filters = this.buildFilters(validatedInput);

    // 3. Repository calls
    const items = await this.libraryRepo.findMany(filters);

    // 4. Transform response
    return {
      success: true,
      data: this.transformItems(items)
    };
  }

  private validateInput(input: LibraryServiceInput) { /* ... */ }
  private buildFilters(input: ValidatedInput) { /* ... */ }
  private transformItems(items: LibraryItem[]) { /* ... */ }
}
```

### 4.3 Server Action Integration

```typescript
// features/view-collection/server-actions/get-library-items.ts
"use server";

import { authorizedActionClient } from '@/shared/lib/safe-action-client';
import { LibraryService } from '@/shared/services';
import { FilterParamsSchema } from '../lib/validation';

const libraryService = new LibraryService();

export const getLibraryItems = authorizedActionClient
  .metadata({ actionName: "getLibraryItems", requiresAuth: true })
  .inputSchema(FilterParamsSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const result = await libraryService.getLibraryItems({
      userId,
      ...parsedInput
    });

    if (!result.success) {
      throw new Error(result.error ?? "Failed to fetch library items");
    }

    return result.data;
  });
```

---

## 5. Implementation Strategy

### 5.1 Phased Rollout

**Phase 1: Foundation (Week 1)**
- Document architecture standards
- Create service layer templates
- Update architecture.md documentation
- Establish testing patterns

**Phase 2: Core Services (Week 2-3)**
- Implement LibraryService
- Implement GameService
- Implement ReviewService
- Implement UserService
- Implement JournalService

**Phase 3: Feature Refactoring (Week 4-6)**
- Refactor manage-library-item
- Refactor add-game
- Refactor dashboard
- Refactor view-game-details
- Refactor remaining features

**Phase 4: Testing & Documentation (Ongoing)**
- Achieve 80%+ test coverage for services
- Update all CLAUDE.md files
- Create migration guide
- Conduct code reviews

### 5.2 Success Criteria

**Architecture Consistency:**
- ✅ All features follow standardized directory structure
- ✅ All business logic resides in service layer
- ✅ All server actions are thin wrappers
- ✅ All services have comprehensive tests

**Code Quality:**
- ✅ Zero TypeScript errors
- ✅ 80%+ test coverage
- ✅ All linting rules pass
- ✅ Documentation complete

**Developer Experience:**
- ✅ Clear architecture documentation
- ✅ Service templates available
- ✅ Onboarding guide created
- ✅ Team training completed

---

## 6. Migration Guidelines

### 6.1 Service Creation Checklist

When creating a new service:

1. **Create service directory** in `shared/services/[domain]/`
2. **Define types** in `types.ts` (input types, output types, result types)
3. **Implement service class** with clear method names
4. **Write unit tests** with mocked repositories
5. **Export from index.ts** for clean imports
6. **Document in service file** with JSDoc comments

### 6.2 Feature Refactoring Checklist

When refactoring an existing feature:

1. **Identify business logic** currently in server actions
2. **Extract to service methods** with proper typing
3. **Update server actions** to call service
4. **Add service tests** for extracted logic
5. **Update feature tests** to reflect new patterns
6. **Update CLAUDE.md** documentation
7. **Test integration** end-to-end

### 6.3 Code Review Guidelines

All PRs implementing this pattern must:

- ✅ Follow standardized directory structure
- ✅ Include service layer tests
- ✅ Update relevant documentation
- ✅ Pass all quality checks (typecheck, lint, test)
- ✅ Include migration notes if breaking changes

---

## 7. Benefits & Expected Outcomes

### 7.1 Immediate Benefits

**For Developers:**
- Clear separation of concerns reduces debugging time
- Consistent patterns lower cognitive load
- Reusable services reduce code duplication
- Testable business logic improves confidence

**For Codebase:**
- Better organization enables faster feature development
- Service layer facilitates code sharing
- Reduced coupling between layers
- Easier refactoring and maintenance

### 7.2 Long-Term Benefits

**Scalability:**
- Architecture supports growth to 100+ features
- Service layer enables microservices extraction if needed
- Clear boundaries facilitate team scaling

**Maintainability:**
- Consistent patterns reduce maintenance burden
- Service tests catch regressions early
- Documentation remains relevant longer

**Quality:**
- Higher test coverage through testable services
- Reduced bug count from isolated business logic
- Better error handling at service layer

---

## 8. Risk Assessment

### 8.1 Identified Risks

**Risk 1: Breaking Changes**
- **Impact**: Medium
- **Mitigation**: Incremental feature-by-feature rollout, comprehensive testing

**Risk 2: Team Learning Curve**
- **Impact**: Low
- **Mitigation**: Documentation, templates, pair programming

**Risk 3: Increased Code Volume**
- **Impact**: Low
- **Mitigation**: Better organization offsets volume, reusability reduces duplication

**Risk 4: Over-Engineering**
- **Impact**: Low
- **Mitigation**: Apply pattern pragmatically, skip service layer for trivial operations

### 8.2 Success Metrics

**Quantitative:**
- Service layer test coverage: >80%
- Feature refactoring completion: 100%
- TypeScript errors: 0
- Linting errors: 0

**Qualitative:**
- Developer satisfaction with architecture
- Reduced time to implement new features
- Fewer bugs related to business logic
- Positive code review feedback

---

## 9. Timeline & Resources

### 9.1 Estimated Timeline

- **Phase 1 (Foundation)**: 1 week, 15-20 hours
- **Phase 2 (Core Services)**: 2 weeks, 20-30 hours
- **Phase 3 (Feature Refactoring)**: 3 weeks, 30-40 hours
- **Phase 4 (Testing & Docs)**: Ongoing, 15-20 hours
- **Total**: 6-7 weeks, 80-110 hours

### 9.2 Required Resources

**Development:**
- Senior engineer for architecture design (you)
- Engineers for implementation (distributed across team)

**Tools & Infrastructure:**
- No additional tools required
- Existing testing infrastructure sufficient
- Documentation in existing platform (CLAUDE.md)

---

## 10. Appendix

### 10.1 Reference Implementation

The `view-collection` feature already implements the target pattern:
- Service layer: `shared/services/collection/collection-service.ts`
- Server action: `features/view-collection/server-actions/get-game-with-backlog-items.ts`
- Tests: `shared/services/collection/collection-service.test.ts`

### 10.2 Related Documentation

- [Architecture Overview](../../product/architecture.md)
- [Repository Pattern Guide](../../product/repository-pattern.md) (to be created)
- [Service Layer Guide](../../product/service-layer-guide.md) (to be created)
- [Testing Standards](../../product/testing-standards.md) (to be created)

### 10.3 Decision Log

**Decision 1: Full Service Layer Adoption**
- **Date**: 2025-10-03
- **Decision**: Implement service layer for all features, not just complex ones
- **Rationale**: Consistency, testability, future scalability

**Decision 2: Validation Strategy**
- **Date**: 2025-10-03
- **Decision**: Input validation in server actions, business validation in services
- **Rationale**: Separation of concerns, defense in depth

**Decision 3: Repository Enhancement**
- **Date**: 2025-10-03
- **Decision**: Keep repositories focused on data access only
- **Rationale**: Single responsibility principle, easier testing

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Next Review**: After Phase 2 completion
