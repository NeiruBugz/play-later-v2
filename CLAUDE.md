# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Core Development
- `bun dev` - Start development server on port 6060 with Turbopack
- `bun build` - Build the application
- `bun start` - Start production server
- `bun preview` - Build and start production server on port 6060

### Code Quality
- `bun lint` - Run ESLint
- `bun lint:fix` - Run ESLint with auto-fix
- `bun typecheck` - Run TypeScript type checking
- `bun format:write` - Format code with Prettier
- `bun format:check` - Check code formatting
- `bun code-fix` - Run format:write and lint:fix together
- `bun code-check` - Run format:check, lint, and typecheck together

### Testing
- `bun test` - Run all tests (unit and integration)
- `bun test:unit` - Run unit tests with mocked Prisma (fast)
- `bun test:integration` - Run integration tests with real database
- `bun test:unit:watch` - Watch unit tests
- `bun test:integration:watch` - Watch integration tests
- `bun test:coverage` - Run tests with coverage report
- `bun test:db:setup` - Start test database with Docker
- `bun test:db:teardown` - Stop test database

### Database
- `bun postinstall` - Generate Prisma client (runs automatically after install)

## Architecture Overview

### Repository Pattern Implementation
The application recently refactored from a domain service layer to a repository pattern. This simplified the architecture by removing domain abstraction and consolidating data access.

**Data Flow**: Next.js App Router → Feature Server Actions → Repository Layer → Prisma → PostgreSQL

### Directory Structure
```
├── app/                    # Next.js App Router pages
├── features/              # Feature-specific code (components, server actions, types)
├── shared/               # Shared utilities, components, and libraries
│   ├── components/       # Reusable UI components (shadcn/ui)
│   ├── lib/             # Shared utilities and repositories
│   │   └── repository/  # Data access layer
│   └── types/           # Shared type definitions
├── prisma/              # Database schema and migrations
└── test/                # Test setup and utilities
```

### Key Architectural Patterns

**Features Organization**: Each feature follows this structure:
```
features/[feature-name]/
├── components/          # React components
├── server-actions/      # Business logic (service layer)
├── lib/                # Feature-specific utilities
├── types/              # Feature-specific types
└── index.ts            # Feature exports
```

**Repository Layer**: Located in `shared/lib/repository/`, provides type-safe data access:
- `backlog/` - Backlog item operations
- `game/` - Game CRUD operations
- `review/` - Review management
- `user/` - User operations
- `imported-game/` - Steam import functionality

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **UI**: shadcn/ui components with Tailwind CSS
- **Authentication**: NextAuth.js v5
- **State Management**: React Server Components, TanStack Query for client state
- **Testing**: Vitest with separate unit/integration configs
- **Package Manager**: Bun

### Key Dependencies
- `@auth/prisma-adapter` - Database adapter for NextAuth
- `@radix-ui/*` - Primitive UI components
- `howlongtobeat` - Game completion time data
- `node-steam-openid` - Steam authentication
- `next-safe-action` - Type-safe server actions
- `zod` - Runtime validation

### Development Practices

**Code Style**:
- Use kebab-case for file names
- Use camelCase for variables and functions
- Use PascalCase for classes, types, and interfaces
- Prefix type parameters with `T` (e.g., `TKey`, `TValue`)
- Use functional and declarative patterns over classes

**Testing Strategy**:
- Unit tests (`.unit.test.ts`) - Fast, mocked Prisma client
- Integration tests (`.integration.test.ts`) - Real database with Docker
- Use test factories in `test/setup/db-factories/` for consistent data
- Coverage thresholds: 80% across all metrics

**Error Handling**:
- Custom error classes in `domain/shared/errors.ts`
- Type-safe error handling with `next-safe-action`
- Early returns and guard clauses for error conditions

### Steam Integration
The application includes Steam integration for importing game libraries:
- OAuth flow through `node-steam-openid`
- Steam Web API for owned games and achievements
- Imported games stored separately before user confirmation

### Database Schema
Key entities:
- `User` - User profiles with Steam integration
- `Game` - Game metadata from IGDB
- `BacklogItem` - User's game collection with status tracking
- `Review` - User reviews with ratings
- `ImportedGame` - Steam games pending import

### IGDB Integration
Uses IGDB (Internet Game Database) API for game metadata:
- Game search and details
- Cover images and screenshots
- Platform information
- Release dates and genres