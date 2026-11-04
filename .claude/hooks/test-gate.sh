#!/usr/bin/env bash
set -uo pipefail

# Stop hook: gate turn completion on unit tests related to the TS files this
# session edited. Unit project only (jsdom + mocked Prisma — fast). Integration
# tests need a real Postgres and run too slowly for a per-turn gate; they stay in CI.
# Exit 0 = allow stop, Exit 2 = block stop and feed stderr back to Claude.

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$HOOKS_DIR/../.." && pwd)}/savepoint-tanstack"
# shellcheck source-path=SCRIPTDIR source=lib/session-edits.sh
source "$HOOKS_DIR/lib/session-edits.sh"

input=$(cat)

# Loop guard: don't re-block a Stop that was itself triggered by a Stop-hook block.
if [ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$PROJECT_DIR" || exit 0

# Scoped to this session's edits so another session's half-finished work in the
# same tree does not block this one.
edited=$(session_edited_ts_files "$input" "$PROJECT_DIR")
[ -z "$edited" ] && exit 0

# `related` runs the unit tests that import the edited files (and the edited test
# files themselves); --passWithNoTests keeps the gate green when none exist.
# shellcheck disable=SC2086
if ! output=$(pnpm exec vitest related --run --project=unit --passWithNoTests $edited 2>&1); then
  echo "Unit tests related to this session's edits failed — fix them before finishing:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
