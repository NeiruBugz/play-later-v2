.PHONY: dev test lint format typecheck

dev:
	docker compose up -d && pnpm --filter savepoint dev

test:
	pnpm --filter savepoint test && cd lambdas-py && uv run pytest

lint:
	pnpm --filter savepoint lint && cd lambdas-py && uv run ruff check .

format:
	pnpm --filter savepoint format:check && cd lambdas-py && uv run ruff format --check .

typecheck:
	pnpm --filter savepoint typecheck && cd lambdas-py && uv run mypy .
