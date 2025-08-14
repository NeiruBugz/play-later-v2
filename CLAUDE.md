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

**Important**: This project uses Vitest as the test runner. Always use `bun run` for test commands to ensure Vitest is used instead of bun's built-in test runner.

- `bun run test` - Run all tests with Vitest
- `bun run test:watch` - Watch mode for tests
- `bun run test:coverage` - Run tests with coverage report

**Note**: Unit and integration test separation and Docker database commands are not currently implemented in package.json.

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
│   ├── [feature]/         # Each feature is self-contained
│   │   ├── components/    # Feature-specific React components
│   │   ├── server-actions/ # Business logic and data operations
│   │   ├── lib/           # Feature utilities and validation
│   │   ├── types/         # Feature-specific type definitions
│   │   └── index.ts       # Feature exports
├── shared/               # Shared utilities, components, and libraries
│   ├── components/       # Reusable UI components (shadcn/ui)
│   ├── lib/             # Shared utilities and repositories
│   │   └── repository/  # Data access layer with type-safe operations
│   ├── types/           # Shared type definitions
│   └── ui/              # shadcn/ui component exports
├── prisma/              # Database schema and migrations
├── test/                # Test setup and utilities
├── documentation/       # Project documentation and AI reports
└── domain/              # Domain-specific error definitions
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

- `backlog/` - Backlog item operations (create, read, update, delete)
- `game/` - Game CRUD operations and IGDB integration
- `review/` - Review management and ratings
- `user/` - User operations and Steam profile management
- `imported-game/` - Steam import functionality and game enrichment

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
- `@radix-ui/*` - Primitive UI components for shadcn/ui
- `node-steam-openid` - Steam authentication via OpenID
- `next-safe-action` - Type-safe server actions
- `zod` - Runtime validation and schema definitions
- `@tanstack/react-query` - Client-side state management and data fetching
- `date-fns` - Date manipulation utilities
- `lucide-react` - Icon library
- `next-themes` - Theme switching functionality
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers

### Development Practices

**Code Style**:

- Use kebab-case for file names
- Use camelCase for variables and functions
- Use PascalCase for classes, types, and interfaces
- Prefix type parameters with `T` (e.g., `TKey`, `TValue`)
- Use functional and declarative patterns over classes

**Testing Strategy**:

- Tests use `.test.tsx` or `.test.ts` extensions
- Server action tests use `.server-action.test.ts` naming convention
- Vitest is configured as the test runner with JSDOM environment
- MSW (Mock Service Worker) for API mocking
- React Testing Library for component testing
- Test factories in `test/setup/db-factories/` for consistent test data
- Coverage reporting available via `bun run test:coverage`

**Error Handling**:

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

- Game search and details with franchise information
- Cover images, screenshots, and artwork
- Platform information and compatibility
- Release dates, genres, and game classifications
- Franchise relationships and similar games
- External game links and Steam app ID mapping

### Additional Features

- **Theme System**: Dark/light theme support with `next-themes`
- **Responsive Design**: Mobile-first approach with shadcn/ui components
- **Performance**: Optimized database queries with composite indexes
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Code Quality**: Commitlint, Lefthook, and comprehensive linting setup
