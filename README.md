# Play Later

A comprehensive game backlogging application that helps you track your gaming collection, manage your backlog, and discover new games to play.

## Reasoning behind the project

I'm in love with video games and it's a big part of my life. I also love to buy games... and probably never play them. So, I've searched for some backlog tool, where I can track my collection of games, track what I have in wishlist, what I haven't played yet and so on. I've found [Backloggd](https://backloggd.com/), but it doesn't fit all my needs, despite that it's a great tool.

But I'm a Software Engineer, so I can build my own tool to cover all my needs for this problem and I've decided to build this. The project has a rich history, several refactoring and technological stack migrations and now you're here.

## History:

- Very first version is [React SPA](https://github.com/NeiruBugz/backlog-app) with [Nest.js Backend](https://github.com/NeiruBugz/backlog-app-nest)
- [Next iteration](https://github.com/NeiruBugz/play-later) was built with Next.js, Firebase
- **You're here** Next.js application, with Prisma, IGDB and Steam integration

## 🚀 Deployment

[PlayLater](https://play-later.vercel.com)

## ✨ Features

- **Game Collection Management**: Track your owned games with custom statuses (backlog, playing, completed, wishlist)
- **Steam Integration**: Import your Steam library and sync game data
- **Game Reviews**: Write and share reviews with ratings for games you've played
- **Backlog Organization**: Organize your gaming backlog with filtering and search capabilities
- **Game Discovery**: Browse and discover new games with detailed information from IGDB
- **Progress Tracking**: Monitor your gaming progress with completion statistics
- **Wishlist Management**: Keep track of games you want to play in the future
- **Achievement Tracking**: View Steam achievements for your games
- **Social Features**: Share your wishlist and view other users' backlogs

## 🛠️ Tech Stack

### Core Framework

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Database & ORM

- **[Prisma](https://prisma.io)** - Type-safe database ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database

### UI & Styling

- **[shadcn/ui](https://ui.shadcn.com/)** - Modern UI component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Primitive UI components
- **[Lucide React](https://lucide.dev/)** - Icon library

### Authentication & APIs

- **[NextAuth.js v5](https://next-auth.js.org/)** - Authentication system
- **[Steam OpenID](https://steamcommunity.com/dev)** - Steam integration
- **[IGDB API](https://www.igdb.com/api)** - Game metadata

### State Management & Data Fetching

- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[next-safe-action](https://next-safe-action.dev/)** - Type-safe server actions
- **[Zod](https://zod.dev/)** - Schema validation

### Development Tools

- **[Vitest](https://vitest.dev/)** - Testing framework
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Bun](https://bun.sh/)** - Package manager and runtime

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── features/              # Feature-specific code (components, server actions, types)
│   ├── add-game/          # Game addition functionality
│   ├── dashboard/         # User dashboard
│   ├── steam-integration/ # Steam API integration
│   ├── view-collection/   # Collection management
│   └── ...
├── shared/               # Shared utilities and components
│   ├── components/       # Reusable UI components
│   ├── lib/             # Shared utilities and repositories
│   │   └── repository/  # Data access layer
│   └── types/           # Shared type definitions
├── prisma/              # Database schema and migrations
└── test/                # Test setup and utilities
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL database
- Steam API key (optional, for Steam integration)
- IGDB API credentials

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/play-later-v2.git
cd play-later-v2
```

2. Install dependencies:

```bash
pnpminstall
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your database and run migrations:

```bash
pnpmpostinstall
```

5. Start the development server:

```bash
pnpmdev
```

Visit [http://localhost:6060](http://localhost:6060) to see the application.

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpmrun test

# Run unit tests (fast, mocked database)
pnpmrun test:unit

# Run integration tests (real database)
pnpmrun test:integration

# Run tests with coverage
pnpmrun test:coverage

# Watch mode
pnpmrun test:unit:watch
pnpmrun test:integration:watch
```

### Test Database Setup

For integration tests, start the test database:

```bash
# Start test database
pnpmrun test:db:setup

# Stop test database
pnpmrun test:db:teardown
```

## 🔧 Development Commands

### Core Development

```bash
pnpmdev          # Start development server on port 6060
pnpmbuild        # Build the application
pnpmstart        # Start production server
pnpmpreview      # Build and start production server
```

### Code Quality

```bash
pnpmlint         # Run ESLint
pnpmlint:fix     # Fix ESLint errors
pnpmtypecheck    # TypeScript type checking
pnpmformat:write # Format code with Prettier
pnpmformat:check # Check code formatting
pnpmcode-fix     # Run format:write and lint:fix
pnpmcode-check   # Run format:check, lint, and typecheck
```

## 🏗️ Architecture

### Repository Pattern

The application uses a repository pattern for data access, providing a clean separation between business logic and data persistence.

**Data Flow**: Next.js App Router → Server Actions → Repository Layer → Prisma → PostgreSQL

### Key Features Architecture

- **Authentication**: NextAuth.js with Prisma adapter
- **Database**: PostgreSQL with Prisma ORM
- **Steam Integration**: OAuth flow with Steam Web API
- **Game Data**: IGDB API for comprehensive game metadata
- **UI Components**: shadcn/ui built on Radix UI primitives
- **State Management**: React Server Components with TanStack Query for client state

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpmrun test`
5. Run code quality checks: `pnpmcode-check`
6. Commit your changes using conventional commits (see examples below)
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with commitlint to ensure consistent commit messages. Here are some examples:

**Features:**

```bash
feat: add Steam library import functionality
feat(auth): implement Steam OAuth integration
```

**Bug Fixes:**

```bash
fix: resolve game search API timeout issue
fix(ui): correct modal overlay z-index problem
```

**Documentation:**

```bash
docs: update API integration guide
docs(readme): add development setup instructions
```

**Refactoring:**

```bash
refactor: migrate from domain services to repository pattern
refactor(components): extract reusable game card component
```

**Performance:**

```bash
perf: optimize database queries with indexes
perf(ui): implement virtual scrolling for game lists
```

**Other Types:**

```bash
chore: update dependencies to latest versions
style: fix code formatting issues
test: add integration tests for Steam API
ci: add automated deployment workflow
build: configure build optimization settings
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://play-later.vercel.com)
- [Documentation](./documentation/)
- [Issues](https://github.com/yourusername/play-later-v2/issues)

## 🙏 Acknowledgments

- [IGDB](https://www.igdb.com/) for comprehensive game data
- [Steam](https://store.steampowered.com/) for game library integration
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
