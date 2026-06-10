#!/usr/bin/env bash
set -uo pipefail

# Stop hook: gate turn completion on unit tests affected by the current changes.
# Unit project only (jsdom + mocked Prisma — fast). Integration tests need a real
# Postgres and run too slowly for a per-turn gate; they stay in CI.
# Exit 0 = allow stop, Exit 2 = block stop and feed stderr back to Claude.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}/savepoint-tanstack"

input=$(cat)

# Loop guard: don't re-block a Stop that was itself triggered by a Stop-hook block.
if [ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$PROJECT_DIR" || exit 0

# Skip unless TS/TSX sources changed — vitest --changed would otherwise no-op anyway,
# but this avoids spinning up vitest at all on doc/config-only turns.
changed=$(
  {
    git diff --name-only HEAD -- '*.ts' '*.tsx'
    git ls-files --others --exclude-standard -- '*.ts' '*.tsx'
  } 2>/dev/null
)
[ -z "$changed" ] && exit 0

# --changed runs only unit tests affected by uncommitted changes; --passWithNoTests
# keeps the gate green when a change has no associated unit test.
if ! output=$(pnpm exec vitest run --project=unit --changed --passWithNoTests 2>&1); then
  echo "Affected unit tests failed — fix them before finishing:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
