---
description: "Phase 3: AI Solution Design - Create technical specification aligned with PlayLater architecture"
allowed-tools: ["Read", "Write", "Task"]
---

# Phase 3: Solution Design for $ARGUMENTS

With validated requirements and problem analysis, I'll now use our Solution Design AI agent to create a comprehensive technical specification.

## Current Progress

Let me review the validated outputs from previous phases:

@documentation/prds/.$ARGUMENTS-state.json

## Solution Design AI Agent

The Solution Design Agent specializes in PlayLater's architecture and will:

1. **Design technical solution** that fits our existing architecture
2. **Define data models** and required database changes
3. **Specify API endpoints** and server actions needed
4. **Map UI/UX components** and user interface flow
5. **Detail integration points** with existing features
6. **Define success metrics** and tracking implementation
7. **Identify technical risks** and mitigation strategies

### PlayLater Architecture Context

The AI agent is trained on our current tech stack:

- **Frontend**: Next.js 15 with App Router, React Server Components
- **Backend**: Server Actions with next-safe-action for type safety
- **Database**: PostgreSQL with Prisma ORM using repository pattern
- **UI**: shadcn/ui components with Tailwind CSS
- **External APIs**: IGDB (game metadata), Steam Web API (achievements, library)
- **Authentication**: NextAuth.js v5 with Steam OpenID integration

### Current Feature Ecosystem

The agent understands integration with existing features:

- **Game Management**: Backlog items, status tracking, ratings
- **Review System**: User reviews, ratings, aggregation
- **Steam Integration**: Library import, achievement tracking
- **User Profiles**: Personal stats, preferences, social features

## Technical Analysis

The AI will generate:

### Architecture Overview

- High-level technical approach
- How it leverages existing patterns
- Scalability and maintainability considerations

### Data Model Design

```prisma
// New Prisma models and relationships
// Modifications to existing models
// Database indexes and constraints
```

### API & Server Action Design

```typescript
// Server action signatures
// Repository function interfaces
// External API integration patterns
```

### Component Architecture

```
features/$ARGUMENTS/
├── components/          # React UI components
├── server-actions/      # Business logic
├── lib/                # Utilities and validation
└── types/              # TypeScript definitions
```

### Integration Specifications

- Dependencies on existing features
- Shared component utilization
- Data flow between features

### Performance & Security

- Database optimization strategies
- Caching approaches
- Security considerations
- Error handling patterns

## Human Technical Review

After AI analysis, you'll validate:

1. **Architecture Alignment** - Does this fit our established patterns?
2. **Technical Feasibility** - Can we build this with our current stack?
3. **Integration Impact** - How does this affect existing features?
4. **Database Changes** - Are schema modifications backward compatible?
5. **Performance** - Will this meet our performance requirements?
6. **Security** - Are there any security implications to consider?

## Risk Assessment

The AI will identify:

- **Technical risks** and mitigation strategies
- **Performance concerns** and optimization approaches
- **Integration challenges** and solutions
- **Scalability considerations** for future growth

## Next Steps

After validation:

1. **Technical approval** from engineering team
2. **Architecture review** with technical lead
3. **Move to Phase 4** - `/prd/generate $ARGUMENTS` for final PRD assembly

---

**Executing Solution Design AI Agent** - This will generate a comprehensive technical specification tailored to PlayLater's architecture for your review and approval.
