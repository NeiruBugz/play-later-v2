# Audit Recommendations — 2026-04-01

## P1 — Fix Soon

### 1. Update stale spec statuses

- **Dimension:** Spec-Driven Development
- **Check:** SDD-06
- **Effort:** Low
- **Details:** Update `context/spec/002-steam-import-foundation/functional-spec.md` Status from Draft to Completed (55/55 tasks done). Add a Status field to `context/spec/005-library-status-redesign/functional-spec.md` and mark it Completed since the feature shipped (commit 9b511db).

### 2. Create specs for new features before implementation

- **Dimension:** Spec-Driven Development
- **Check:** SDD-04
- **Effort:** Low
- **Details:** Current spec-to-branch ratio is 67% (just under 70% threshold). Ensure all new `feat/` branches have a corresponding spec directory under `context/spec/` with tasks checked off during implementation. The auth migration and journal entries features lacked specs.

### 3. Include cross-layer changes in feature branches

- **Dimension:** End-to-End Delivery
- **Check:** E2E-01
- **Effort:** Low
- **Details:** Recent development is concentrated in `savepoint-app/` only. When features require changes to `lambdas-py/` or `infra/`, bundle them in the same feature branch per the project's documented cross-layer workflow. This may naturally improve as spec 008 (social engagement) progresses.

### 4. Configure Lambda local invoke tooling

- **Dimension:** AI Development Tooling
- **Check:** AI-07
- **Effort:** Low
- **Details:** The agent cannot locally invoke or test Python Lambda functions. Consider configuring SAM CLI (`sam local invoke`) or LocalStack Lambda invoke (`awslocal lambda invoke`) as an MCP tool or documenting a workaround in `lambdas-py/CLAUDE.md`.

## P2 — Improve When Possible

### 5. Add QA agent for verification sub-tasks

- **Dimension:** Spec-Driven Development
- **Check:** SDD-07
- **Effort:** Low
- **Details:** Verification sub-tasks like "Verify: pnpm build passes" are currently assigned to implementation agents (e.g., `nextjs-fullstack`). Create or designate a `testing` or `manual-qa-expert` agent for verification steps in `tasks.md` files.

### 6. Fix stale README reference

- **Dimension:** Documentation Quality
- **Check:** DOC-04
- **Effort:** Low
- **Details:** `savepoint-app/README.md` still references `shared/lib/repository/` as the data access layer. Update to reflect the refactored `data-access-layer/` directory at the top level of `savepoint-app/`.

### 7. Connect or remove orphaned Review model

- **Dimension:** End-to-End Delivery
- **Check:** E2E-04
- **Effort:** Low
- **Details:** The `Review` model exists in the Prisma schema but has no dedicated API routes or UI consumer beyond constraint tests. Either implement the review feature or remove the model if it's not planned. The `Follow` model is WIP on the social-engagement branch and is acceptable.

### 8. Update spec 005 tasks.md

- **Dimension:** Spec-Driven Development
- **Check:** SDD-06
- **Effort:** Low
- **Details:** `context/spec/005-library-status-redesign/tasks.md` has 0/57 tasks checked off despite the feature being shipped. Check off completed tasks to maintain accurate spec tracking.
