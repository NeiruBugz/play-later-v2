.PHONY: dev test lint format typecheck

dev:
	docker compose up -d && pnpm --filter savepoint dev

test:
	pnpm --filter savepoint test

lint:
	pnpm --filter savepoint lint

format:
	pnpm --filter savepoint format:check

typecheck:
	pnpm --filter savepoint typecheck
