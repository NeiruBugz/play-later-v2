# Gemini Project Context: SavePoint

This document provides context for the SavePoint project, a full-stack web application for managing video game backlogs.

## Project Overview

SavePoint is a monorepo containing a Next.js application and Terraform infrastructure code. The main application, `savepoint-app`, allows users to track their game collection, manage their backlog, discover new games, and integrate with their Steam library.

### Key Technologies

- **Application (`savepoint-app`):**
  - Next.js 15 (with App Router)
  - React 19
  - TypeScript
  - Prisma (ORM)
  - PostgreSQL (Database)
  - NextAuth.js v5 (Authentication)
  - Tailwind CSS (Styling)
  - shadcn/ui (UI Components)
  - Vitest (Unit/Integration Testing)
  - Playwright (End-to-End Testing)
- **Infrastructure (`infra`):**
  - Terraform
  - AWS (Cognito for authentication, S3 for storage)
- **Local Development:**
  - Docker Compose (PostgreSQL, pgAdmin, LocalStack for S3)
  - pnpm (Package Manager)

### Architecture

The project follows a monorepo structure managed by pnpm workspaces.

- `savepoint-app/`: The main Next.js application. It uses a feature-based structure and a repository pattern for data access.
- `infra/`: Terraform code for provisioning AWS resources, with separate environments for `dev` and `prod`.
- `scripts/`: Utility scripts for tasks like initializing the local development environment.

## Building and Running

### Prerequisites

- pnpm
- Docker

### Local Development Setup

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

2.  **Start Services:**
    Start the PostgreSQL database and LocalStack (for S3 emulation) using Docker.
    ```bash
    docker-compose up -d
    ```

3.  **Initialize Local S3:**
    Create the local S3 bucket and apply CORS settings.
    ```bash
    bash scripts/init-localstack.sh
    ```

4.  **Configure Environment:**
    Navigate to the app directory, copy the example environment file, and fill in the necessary values (database connection, auth secrets, etc.).
    ```bash
    cd savepoint-app
    cp .env.example .env.local
    ```

5.  **Prepare Database:**
    Generate the Prisma client.
    ```bash
    pnpm postinstall
    ```
    *Note: To apply migrations, you would typically run a command like `pnpm prisma migrate dev`, but the project seems to handle this as part of its setup.*

6.  **Run the Application:**
    Start the Next.js development server.
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:6060`.

### Running Tests

- **Unit & Integration Tests:**
  ```bash
  # From the savepoint-app/ directory
  pnpm test
  ```

- **End-to-End Tests:**
  Requires the development server to be running.
  ```bash
  # From the savepoint-app/ directory
  pnpm test:e2e
  ```

## Development Conventions

- **Package Management:** The project uses `pnpm` and its workspace feature to manage the monorepo.
- **Code Style:** Code formatting is enforced by Prettier and linting by ESLint.
  - `pnpm -C savepoint-app code-check`: Run all code quality checks.
  - `pnpm -C savepoint-app code-fix`: Automatically fix formatting and linting issues.
- **Commit Messages:** This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. A `commitlint` configuration is in place to enforce this.
- **Authentication:** Authentication is handled by NextAuth.js. For local development, a credentials-based login is available. In production, it uses AWS Cognito, which can be federated with providers like Google and Steam.
- **Data Access:** The application uses the repository pattern to abstract data persistence logic, with Prisma as the ORM for interacting with the PostgreSQL database.
