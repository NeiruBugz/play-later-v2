# SavePoint

A comprehensive game backlogging application that helps you track your gaming collection, manage your backlog, and discover new games to play.

## Monorepo Notice

This project now lives inside a monorepo. The application code is in `savepoint-app/` and infrastructure code is in `infra/` at the repo root. Run app commands from this folder, or prefix with `pnpm -C savepoint-app` from the repo root.

Examples:

```
# from repo root
pnpm -C savepoint-app install
pnpm -C savepoint-app dev

# or change directory first
cd savepoint-app
pnpm install
pnpm dev
```

## Reasoning behind the project

I'm in love with video games and it's a big part of my life. I also love to buy games... and probably never play them. So, I've searched for some backlog tool, where I can track my collection of games, track what I have in wishlist, what I haven't played yet and so on. I've found [Backloggd](https://backloggd.com/), but it doesn't fit all my needs, despite that it's a great tool.

But I'm a Software Engineer, so I can build my own tool to cover all my needs for this problem and I've decided to build this. The project has a rich history, several refactoring and technological stack migrations and now you're here.

## History:

- Very first version is [React SPA](https://github.com/NeiruBugz/backlog-app) with [Nest.js Backend](https://github.com/NeiruBugz/backlog-app-nest)
- [Next iteration](https://github.com/NeiruBugz/play-later) was built with Next.js, Firebase
- **You're here** Next.js application, with Prisma, IGDB and Steam integration

## 🚀 Deployment

[SavePoint](https://play-later.vercel.com)

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

- **[Vitest](https://vitest.dev/)** - Unit and integration testing
- **[Playwright](https://playwright.dev/)** - End-to-end testing
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
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your database and run migrations:

```bash
pnpm postinstall
```

5. Start the development server:

```bash
pnpm dev
```

Visit [http://localhost:6060](http://localhost:6060) to see the application.

## 🧪 Testing

### Running Tests

```bash
# Run all tests (unit + integration)
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### End-to-End (E2E) Testing with Playwright

The project uses Playwright for E2E testing to ensure the application works correctly from a user's perspective.

**Prerequisites:**

- Development server must be running on `http://localhost:6060` before running E2E tests
- For authentication tests, set `AUTH_ENABLE_CREDENTIALS=true` in your `.env` file

**Running E2E Tests:**

```bash
# Run all E2E tests (headless mode)
pnpm test:e2e

# Run E2E tests with UI mode (interactive)
pnpm test:e2e:ui

# Debug E2E tests (step through with Playwright Inspector)
pnpm test:e2e:debug
```

**E2E Test Structure:**

- Test files: `e2e/*.spec.ts`
- Test helpers: `e2e/helpers/`
  - `auth.ts`: Authentication utilities (sign in, sign out, session management)
  - `db.ts`: Database seeding and cleanup utilities

**Writing E2E Tests:**

E2E tests should focus on critical user flows:

- Authentication (sign up, sign in, sign out)
- Game collection management (add, edit, delete games)
- Steam integration workflows
- User profile management

Example:

```typescript
import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import { clearTestData, createTestUser } from "./helpers/db";

test.describe("User Authentication", () => {
  test("should allow user to sign in", async ({ page }) => {
    const testUser = await createTestUser({
      email: "test@example.com",
      username: "testuser",
      password: "TestPassword123!",
    });

    await signInWithCredentials(page, testUser.email, testUser.password);

    // Verify user is on the dashboard
    await expect(page).toHaveURL("/");
  });

  test.afterAll(async () => {
    await clearTestData();
  });
});
```

### Test Database Setup

For integration tests, start the test database:

```bash
# Start test database
pnpm test:db:setup

# Stop test database
pnpm test:db:teardown
```

## 🪣 LocalStack S3 Setup

### What is LocalStack?

LocalStack is a fully functional local AWS cloud stack that emulates AWS services like S3, DynamoDB, Lambda, and more. For this project, we use LocalStack to emulate AWS S3 for local development of features like avatar uploads, eliminating the need for real AWS credentials during development.

### Starting LocalStack

LocalStack runs as a Docker container alongside PostgreSQL and pgAdmin. To start it:

```bash
# From repository root
docker-compose up -d localstack

# Or start all services at once
docker-compose up -d
```

LocalStack will be available at `http://localhost:4568` (mapped from internal port 4566 to avoid conflicts with other LocalStack instances).

### Initializing the S3 Bucket

After starting LocalStack for the first time, you need to create the S3 bucket and apply CORS configuration:

```bash
# From repository root
bash scripts/init-localstack.sh
```

This script will:

- Wait for LocalStack to be ready
- Create the `savepoint-dev` bucket
- Apply CORS configuration to allow uploads from `http://localhost:6060`

### Verifying Setup

You can verify that LocalStack is working correctly using the AWS CLI:

```bash
# List all buckets
aws --endpoint-url=http://localhost:4568 s3 ls

# Check CORS configuration
aws --endpoint-url=http://localhost:4568 s3api get-bucket-cors --bucket savepoint-dev

# List bucket contents
aws --endpoint-url=http://localhost:4568 s3 ls s3://savepoint-dev/
```

### Environment Configuration

The application requires these environment variables to connect to LocalStack (already configured in `.env.example`):

```bash
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4568
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=savepoint-dev
S3_AVATAR_PATH_PREFIX=user-avatars/
```

For LocalStack, you can use `test` for both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

### Troubleshooting

**Port 4568 already in use:**
If you see an error about port 4568 being in use, check if another process is using it:

```bash
# Check what's using port 4568
lsof -i :4568

# Stop all Docker containers
docker-compose down

# Start fresh
docker-compose up -d
```

**Note:** This project uses port 4568 (instead of the default 4566) to avoid conflicts with other LocalStack instances you may have running.

**Bucket not found:**
If you get "bucket not found" errors, re-run the initialization script:

```bash
bash scripts/init-localstack.sh
```

**Data persistence:**
LocalStack data is persisted in the `localstack-data/` directory at the repository root. To start fresh:

```bash
# Stop LocalStack
docker-compose down localstack

# Remove persisted data
rm -rf localstack-data

# Start and reinitialize
docker-compose up -d localstack
bash scripts/init-localstack.sh
```

**AWS CLI not configured:**
The AWS CLI commands above don't require AWS credentials configuration. They use the `--endpoint-url` flag to point directly to LocalStack.

## 🔧 Development Commands

### Core Development

```bash
pnpm dev          # Start development server on port 6060
pnpm build        # Build the application
pnpm start        # Start production server
pnpm preview      # Build and start production server
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm typecheck    # TypeScript type checking
pnpm format:write # Format code with Prettier
pnpm format:check # Check code formatting
pnpm code-fix     # Run format:write and lint:fix
pnpm code-check   # Run format:check, lint, and typecheck
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

## 🔐 Authentication Session Policy

The application uses NextAuth.js with a JWT-based session. Sessions are configured for long-lived but rotating authentication to balance convenience and safety.

- Max age: 30 days. Users remain signed in across browser restarts for up to 30 days (`SESSION_MAX_AGE` in `auth.ts`).
- Rotation cadence: 24 hours. The session token is re-issued every 24 hours (`SESSION_UPDATE_AGE`), reducing exposure if a token is compromised shortly after issuance.
- Strategy: `jwt`. The session is stored in an HTTP-only cookie; in production it is marked `secure` with a default `sameSite` of `lax` as provided by NextAuth.
- Sign-out and revocation: Signing out clears the local session. Global invalidation across devices is not yet implemented; rotating `AUTH_SECRET` forces a global logout but should be coordinated carefully. A dedicated “Sign out on all devices” feature is planned in a later slice.
- Where to change: Update `SESSION_MAX_AGE` and `SESSION_UPDATE_AGE` in `savepoint-app/auth.ts` if different durations are required.

## 🔑 Credentials-Based Login (Dev/Test)

For local development and automated tests, the app includes a Credentials provider (email + password) in addition to OAuth.

- Enablement: The credentials form is shown by default in development and test. In production it is hidden unless `AUTH_ENABLE_CREDENTIALS=true`.
- Configure: Set `AUTH_ENABLE_CREDENTIALS=true` in `savepoint-app/.env.local` to force-enable when needed. An example is present in `.env.example`.
- Where it appears: Visit `/login`. Use the toggle to switch between "Sign In" and "Sign Up".
- Sign up flow: Enter email and a password (min 8 chars). Name is optional. Successful sign up auto-signs in and redirects to `/dashboard`.
- Sign in flow: Enter the same email/password you signed up with. Email matching is case-insensitive.
- How it works: `Credentials` provider is conditionally included in `auth.ts` and validates against users stored in the database; passwords are hashed with bcrypt and verified in `shared/lib/app/auth/credentials-callbacks.ts`.
- Test helpers: See `e2e/helpers/db.ts#createTestUser` and `e2e/helpers/auth.ts#signInWithCredentials` to seed and log in users during E2E.
- Security note: This path is intended for dev/test only and is disabled in production by default. Do not reuse real passwords.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm test`
5. Run code quality checks: `pnpm code-check`
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
