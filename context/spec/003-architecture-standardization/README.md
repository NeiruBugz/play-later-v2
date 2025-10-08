# Specification 003: Architecture Standardization & Service Layer Implementation

**Status:** Planning Complete - Ready for Implementation
**Priority:** High
**Estimated Effort:** 90-120 hours (7-9 weeks) _(Updated after audit)_
**Target Start:** TBD
**Owner:** Architecture Team

**Last Updated:** 2025-10-08 _(Post-Audit)_

---

## 🚨 Important Update (2025-10-08)

**This specification has been updated based on comprehensive feature audit.**

### Key Changes:

1. **Added Phase 0**: Feature structure standardization before service migration
2. **Two-Pattern Architecture**: Acknowledged and documented Server Actions + React Query patterns
3. **Realistic Estimates**: Increased from 80-110 hours to 90-120 hours
4. **Service Layer NOT Used**: Audit revealed zero features currently use existing service layer
5. **New Documentation**: Comprehensive guides for standardization and migration

### Critical Findings:

- ❌ Service layer exists but is NOT used by any features
- ❌ All features call repositories directly (40+ files)
- ❌ Inconsistent feature structure (nested sub-features, validation locations)
- ✅ Emerging React Query pattern in `view-imported-games` (should be formalized)

**→ See [Feature Audit](./feature-audit.md) for complete analysis**

---

## Quick Navigation

### 📊 Understanding the Current State

- **[Feature Audit](./feature-audit.md)** - Comprehensive analysis of architecture issues
  - Service layer usage analysis
  - Structure inconsistencies
  - Pattern analysis (Server Actions vs React Query)
  - Migration complexity assessment

### 📋 Implementation Planning

- **[Updated Tasks](./tasks-updated.md)** - Revised task list (USE THIS)
  - Phase 0: Structure standardization
  - Phase 1-5: Service migration and testing
  - Week-by-week breakdown
- **[Original Tasks](./tasks.md)** - Original plan (For reference only)

### 🏗️ Architecture Guidelines

- **[Two-Pattern Architecture Guide](./two-pattern-architecture.md)** - Choose the right pattern
  - Pattern 1: Server Actions (Default - for most features)
  - Pattern 2: API Routes + React Query (Advanced - for specific use cases)
  - Decision matrix and code examples
  - When to use each pattern

### ✅ Development Standards

- **[Feature Structure Standard](./feature-structure-standard.md)** - How to structure features
  - Standard directory structure
  - File naming conventions
  - Validation location rules
  - Service layer integration requirements
  - Automated compliance checker

### 📚 Original Specification Documents

- **[Functional Specification](./functional-spec.md)** - What and why _(Original)_
- **[Technical Considerations](./technical-considerations.md)** - How to build _(Original)_

---

## Executive Summary

### Problem (Updated)

The PlayLater application has significant architectural inconsistencies:

1. **Service Layer Not Used**
   - Service layer was implemented and tested
   - **Zero features** currently use it
   - All features call repositories directly from server actions
   - 40+ files with direct repository imports

2. **Inconsistent Feature Structure**
   - `manage-library-item` has nested sub-features (breaks convention)
   - `view-imported-games` uses `/validation/` instead of `/lib/validation.ts`
   - Some features use `/types/` directories, others use flat `types.ts`
   - No clear standard for feature organization

3. **Hybrid Architecture Patterns**
   - Most features: Server Actions → Repository (bypassing services)
   - One feature: React Query + API Route → Repository (bypassing services)
   - No guidelines for when to use which pattern

### Solution (Updated)

**Two-phase approach:**

**Phase 0: Standardize Feature Structure**

- Flatten nested sub-features
- Consolidate validation to `/lib/validation.ts`
- Flatten `/types/` directories to `types.ts` files
- Establish clear conventions

**Phase 1-5: Service Layer Migration**

- Integrate all features with service layer
- Support two valid patterns (Server Actions + React Query)
- Comprehensive testing (>80% coverage)
- Complete documentation updates

### Architecture Flow

**Pattern 1: Server Actions** (Default - ~12 features)

```
Page → Server Action → Service Layer → Repository → Database
       (thin wrapper)   (business logic)  (data access)
```

**Pattern 2: API Routes + React Query** (Advanced - ~2-3 features)

```
Page → React Query Hook → API Route → Service Layer → Repository → Database
       (client state)      (thin wrapper) (business logic)  (data access)
```

---

## What's Changed

### NEW: Phase 0 - Feature Standardization (Week 1)

- Flatten `manage-library-item` nested structure
- Move `view-imported-games` validation to standard location
- Flatten `/types/` directories across 5 features
- Create automated compliance checker
- **Deliverable**: Consistent structure across all features

### UPDATED: Phase 1 - Documentation (Week 2)

- Document two-pattern architecture
- Create pattern decision tree
- Update migration guide for both patterns
- **Deliverable**: Clear guidelines for pattern selection

### UNCHANGED: Phase 2 - Core Services ✅

- LibraryService ✅
- GameService ✅
- ReviewService ✅
- UserService ✅
- JournalService ✅
- **Status**: Already complete

### REORGANIZED: Phase 3 - Feature Migration (Weeks 3-7)

**Now organized by complexity:**

- **Week 3**: Simple migrations (3 features)
  - `add-review`, `manage-user-info`, `view-wishlist`

- **Weeks 4-5**: Medium migrations (3 features)
  - `manage-library-item`, `view-game-details`, `dashboard`

- **Week 6**: Complex migrations (2 features)
  - `add-game`, `steam-integration`

- **Week 7**: Pattern 2 decisions (4 features)
  - `view-collection` (evaluate for React Query)
  - `view-imported-games` (add service layer to existing React Query)
  - `view-backlogs`, `manage-integrations`

---

## Key Documents Deep Dive

### 1. Feature Audit (NEW) 📊

**Critical findings:**

- Service layer exists but unused
- 17 features analyzed
- 40+ files calling repositories directly
- Structure inconsistencies documented
- Migration complexity assessed

**Read this first** to understand what we're fixing and why.

### 2. Two-Pattern Architecture Guide (NEW) 🏗️

**Defines two valid patterns:**

**Pattern 1: Server Actions**

- ✅ Use for: Forms, CRUD, server-rendered pages
- ✅ Simpler, better for SEO, less JavaScript
- ✅ Example: `add-review`, `manage-library-item`

**Pattern 2: API Routes + React Query**

- ✅ Use for: Complex filtering, client caching, optimistic updates
- ✅ Better caching, progressive loading, background refetch
- ✅ Example: `view-imported-games`

**Includes decision matrix** to help choose the right pattern.

### 3. Feature Structure Standard (NEW) 📋

**Official standard for all features:**

```
features/[feature-name]/
├── components/
├── server-actions/          # Pattern 1 OR
├── hooks/                   # Pattern 2
├── lib/
│   └── validation.ts        # ⚠️ REQUIRED (not /validation/)
├── types.ts                 # ⚠️ Flat file (not /types/ dir)
├── index.ts
└── CLAUDE.md
```

**Forbidden patterns:**

- ❌ NO `/validation/` directory
- ❌ NO `/types/` directory (unless >5 type files)
- ❌ NO nested sub-features
- ❌ NO direct repository calls

### 4. Updated Tasks (REVISED) ✅

**Complete implementation plan:**

- **Phase 0**: Structure standardization (6 slices, Week 1)
- **Phase 1**: Documentation updates (2 slices, Week 2)
- **Phase 2**: Core services ✅ (Already complete)
- **Phase 3**: Feature migration (12 features, Weeks 3-7)
- **Phase 4**: Testing & QA (4 slices, Week 8)
- **Phase 5**: Documentation & deployment (5 slices, Week 9)

**Total**: 28 slices, 90-120 hours, 9 weeks

---

## Success Criteria (Updated)

### Structural Standardization ✅

- [ ] All features use `/lib/validation.ts` (NOT `/validation/`)
- [ ] No nested sub-features (flatten `manage-library-item`)
- [ ] Types in `types.ts` files (flatten `/types/` directories)
- [ ] Consistent structure across all features
- [ ] Automated compliance checker in place

### Service Layer Integration ✅

- [ ] Zero direct repository imports in server actions
- [ ] Zero direct repository imports in API routes
- [ ] All server actions call service layer
- [ ] All API routes call service layer
- [ ] Services have >90% test coverage

### Architecture Clarity ✅

- [ ] Two patterns clearly documented
- [ ] Decision tree for pattern selection
- [ ] Examples of both patterns in codebase
- [ ] Updated migration guide for both patterns

### Code Quality ✅

- [ ] All features have passing tests
- [ ] `pnpm typecheck` passes (zero errors)
- [ ] `pnpm lint` passes (zero errors)
- [ ] `pnpm test` passes with >80% coverage
- [ ] `pnpm build` succeeds (zero errors)

---

## Current Metrics (Updated After Audit)

| Metric                      | Current            | Target               | Status         |
| --------------------------- | ------------------ | -------------------- | -------------- |
| **Service Layer Adoption**  | 0/12 data features | 12/12 features       | 🔴             |
| **Service Test Coverage**   | >90%               | >90%                 | ✅             |
| **Feature Structure**       | Inconsistent       | Standardized         | 🔴             |
| **Direct Repository Calls** | 40+ files          | 0 files              | 🔴             |
| **Pattern Documentation**   | None               | Complete             | 🟡 In Progress |
| **Validation Location**     | Mixed              | `/lib/validation.ts` | 🔴             |
| **Types Organization**      | Mixed              | `types.ts` flat file | 🔴             |
| **Overall Coverage**        | ~70%               | >80%                 | 🟡             |

**Legend**: ✅ Complete | 🟡 In Progress | 🔴 Not Started

---

## Timeline & Milestones (Updated)

### Week 1: Feature Standardization (NEW Phase 0)

- **Milestone:** Consistent structure across all features
- **Deliverables:**
  - Flatten `manage-library-item` structure
  - Fix `view-imported-games` validation location
  - Flatten `/types/` directories in 5 features
  - Automated compliance checker script
  - Documentation: Feature Structure Standard

### Week 2: Architecture Documentation (Updated Phase 1)

- **Milestone:** Clear guidelines for both patterns
- **Deliverables:**
  - Two-Pattern Architecture Guide
  - Pattern decision tree
  - Updated migration guide
  - Code examples for both patterns

### Weeks 3-7: Feature Migration (Reorganized Phase 3)

- **Week 3:** Simple features (3 features) ✅
- **Weeks 4-5:** Medium features (3 features) ✅
- **Week 6:** Complex features (2 features) ✅
- **Week 7:** Pattern 2 decisions (4 features) ✅
- **Milestone:** All 12 features using service layer
- **Deliverable:** Refactored features with updated tests and docs

### Week 8: Testing & QA (Phase 4)

- **Milestone:** Production ready
- **Deliverables:**
  - > 80% overall coverage
  - Zero TypeScript/lint errors
  - E2E testing complete
  - Performance verified

### Week 9: Final Documentation (Phase 5)

- **Milestone:** Deployment ready
- **Deliverables:**
  - All CLAUDE.md files updated
  - Lessons learned documented
  - Pre-deployment verification complete

---

## Risk Assessment (Updated)

| Risk                         | Impact | Probability | Mitigation                                          | Status        |
| ---------------------------- | ------ | ----------- | --------------------------------------------------- | ------------- |
| **Breaking changes**         | High   | Medium      | Incremental rollout, comprehensive testing          | 🟡 Mitigated  |
| **Scope creep**              | High   | High        | Fixed scope, no new features during standardization | 🔴 Monitor    |
| **Service layer complexity** | Medium | Low         | Already implemented and tested                      | ✅ Resolved   |
| **Pattern confusion**        | Medium | Medium      | Clear decision tree, documentation                  | 🟡 Addressing |
| **Team learning curve**      | Low    | Low         | Templates, examples, pair programming               | ✅ Manageable |
| **Performance regression**   | Low    | Low         | Benchmarking, monitoring                            | 🟡 Monitor    |

**New Risk Identified:**

- **Time underestimation**: Original plan didn't account for structure standardization
  - **Mitigation**: Added Phase 0, increased estimate to 90-120 hours

---

## Decision Log

### Decisions Made (Updated)

| Date       | Decision                                          | Rationale                                            |
| ---------- | ------------------------------------------------- | ---------------------------------------------------- |
| 2025-10-03 | Adopt service layer for all features              | Consistency and maintainability                      |
| 2025-10-08 | Support two architectural patterns                | Different features have different needs              |
| 2025-10-08 | Standardize structure before service migration    | Clean foundation enables easier migration            |
| 2025-10-08 | Keep React Query pattern in `view-imported-games` | Already working well, demonstrates valid alternative |
| 2025-10-08 | Validation must be in `/lib/validation.ts`        | Consistency across all features                      |
| 2025-10-08 | No nested sub-features                            | Flatten for consistency and maintainability          |

### Open Questions

- [ ] Should we migrate `view-collection` to React Query pattern?
- [ ] Do we need feature flags for gradual rollout?
- [ ] Should we create video tutorials for patterns?
- [ ] Is automated compliance checking sufficient or do we need manual reviews?

---

## Getting Started

### For New Development

1. Read [Two-Pattern Architecture Guide](./two-pattern-architecture.md)
2. Choose pattern based on decision matrix
3. Follow [Feature Structure Standard](./feature-structure-standard.md)
4. Use service layer for all business logic
5. Run compliance checker before PR

### For Migration Work

1. Read [Feature Audit](./feature-audit.md) to understand issues
2. Follow [Updated Tasks](./tasks-updated.md) for implementation plan
3. Start with Phase 0 (structure standardization)
4. Then proceed with service layer integration
5. Verify with tests and compliance checker

### For Learning

1. Start with [Feature Audit](./feature-audit.md) for context
2. Read [Two-Pattern Architecture Guide](./two-pattern-architecture.md) for patterns
3. Review [Feature Structure Standard](./feature-structure-standard.md) for conventions
4. Examine working examples:
   - Pattern 1: `features/add-review/`
   - Pattern 2: `features/view-imported-games/`

---

## References

### Internal Documentation

- [Architecture Overview](../../product/architecture.md)
- [Service Layer Guide](../../product/service-layer-guide.md)
- [Migration Guide](../../product/migration-guide.md)
- [Repository Pattern](../002-savepoint-database-migration/)

### New Documentation (This Spec)

- **[Feature Audit](./feature-audit.md)** - Current state analysis
- **[Updated Tasks](./tasks-updated.md)** - Implementation plan
- **[Two-Pattern Architecture](./two-pattern-architecture.md)** - Pattern guidelines
- **[Feature Structure Standard](./feature-structure-standard.md)** - Structure conventions

### Example Implementations

- **Pattern 1 Example**: `features/add-review/`
  - Server actions → ReviewService → Repository
- **Pattern 2 Example**: `features/view-imported-games/`
  - React Query → API Route → ImportedGameService → Repository
  - See `REFACTOR.md` for detailed migration documentation

### External Resources

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Feature-Driven Architecture](https://dev.to/rufatalv/feature-driven-architecture-with-nextjs-a-better-way-to-structure-your-application-1lph)

---

## Next Steps

1. ✅ **Complete Planning** - Review and approve updated spec
2. 🔄 **Get Team Buy-In** - Ensure understanding of two-pattern approach
3. 🚀 **Start Phase 0** - Begin feature structure standardization
4. 📊 **Track Progress** - Update tasks.md as work progresses
5. 📝 **Document Learnings** - Create lessons-learned.md during migration

---

## Change Log

| Date       | Version | Changes                                                                                 | Author            |
| ---------- | ------- | --------------------------------------------------------------------------------------- | ----------------- |
| 2025-10-03 | 1.0     | Initial specification                                                                   | Architecture Team |
| 2025-10-08 | 2.0     | Post-audit update: Added Phase 0, two-pattern architecture, comprehensive documentation | Architecture Team |

---

**Status**: ✅ Planning Complete - Ready for Implementation

**Next Action**: Begin Phase 0, Slice 0.1 - Create standardization guidelines

**Owner**: Architecture Team

**Review Date**: After Phase 0 completion
