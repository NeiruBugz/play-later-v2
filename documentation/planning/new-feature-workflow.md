# AI-Driven Feature Development Workflow

## Executive Summary

This document outlines the standardized workflow for introducing new features into the Play Later v2 application. This process is optimized for development assisted by AI Agents (e.g., Gemini, Claude, Cursor) and is founded on iterative, quality-first principles. Adherence to this workflow is mandatory for all new feature development.

## Guiding Principles

- **Modularity**: Every feature is a self-contained module within the `features/` directory.
- **Documentation-Driven**: Features begin with clear requirements (`PRD.md`) before code is written.
- **Iterative Development & Atomic Commits**: Features are built in small, independently verifiable steps. Each step is validated and committed separately, creating a clean and traceable history.
- **Continuous Quality**: Quality is not a phase but a constant practice. Linters and type checks are run for every incremental change.
- **Test-First Mentality**: Comprehensive testing is a core part of development, guided by our `comprehensive-testing-strategy.md`.

## AI Agent Collaboration Guidelines

**All AI-powered development tools must strictly adhere to the following rules:**

1.  **Deconstruct the PRD**: Break down the feature's `PRD.md` into the smallest possible, logical, and sequential tasks.
2.  **Follow the Core Loop**: For each task, execute the "Implement -> Validate -> Commit" loop described in Phase 2.
3.  **Validate Before Committing**: Before every commit, you **must** run the required quality checks:
    - `bun run lint`: To check for code style and quality issues.
    - `bun run typecheck`: To ensure type safety.
4.  **Atomic & Descriptive Commits**: Each commit must represent a single, complete piece of work. The commit message must be meaningful and respect the `commitlint` configuration (e.g., `feat(profile): add user avatar component`).

## The Feature Lifecycle: Step-by-Step

### Phase 1: Planning & Design

1.  **Create Feature Directory**: Create a new directory for your feature under `features/` (e.g., `user-profile`).
2.  **Define Requirements**: Create a `PRD.md` detailing user stories, acceptance criteria, and technical scope.
3.  **Deconstruct PRD**: Break the PRD into a checklist of small, sequential tasks. This will guide the iterative development process.

### Phase 2: The Core Development Loop

For each task identified in the PRD checklist, perform the following steps:

1.  **Implement**: Write the necessary code (components, logic, types, tests) to complete the task. This includes:
    - **Dependencies**: If a new library is needed, run `bun add <package-name>` as the first action of this step.
    - **Environment Variables**: If new secrets or variables are required, update the Zod schema in `env.mjs` to reflect the changes.
    - **Database Migrations**: If the task requires a schema change, run `bunx prisma migrate dev --name <migration-name>` to generate the necessary migration file.
2.  **Validate**: Run the local quality checks.
    - `bun run lint`
    - `bun run typecheck`
    - `bun run test` (for the relevant tests)
3.  **Commit**: Once validation passes, commit all related files (including `package.json`, `env.mjs`, or new migrations) with a descriptive, compliant commit message.
4.  **Repeat**: Continue this loop until all tasks in the PRD checklist are completed and committed.

### Phase 3: Final Integration & Pull Request

1.  **Create Pull Request (PR)**: After the last task is committed, push the feature branch to GitHub and open a PR against the `main` branch. The PR description should summarize the work done.
2.  **Automated CI Checks**: The `pr-checks.yml` GitHub Action will run the full suite of tests, linting, and build checks.
3.  **Peer Review**: Request a review from at least one other team member.

### Phase 4: Merge

1.  **Approve & Merge**: Once the PR is approved and all CI checks are green, merge it into the `main` branch.

## Definition of Done

A feature is "done" when:

- [ ] All tasks derived from the `PRD.md` are implemented and committed.
- [ ] Every commit has passed local linting and type checks.
- [ ] The final PR has passed all automated CI checks.
- [ ] The PR has been approved by a peer.
- [ ] The feature branch is merged into `main`.

## Conclusion

This iterative, AI-friendly workflow ensures that every piece of code is validated before it's integrated, leading to a more robust and maintainable codebase. By creating a clean, atomic commit history, we improve traceability and simplify future debugging and refactoring efforts.
