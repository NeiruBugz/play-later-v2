#!/usr/bin/env bash
set -uo pipefail

# Stop hook: gate turn completion on a clean TypeScript check.
# Exit 0 = allow stop, Exit 2 = block stop and feed stderr back to Claude.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}/savepoint-tanstack"

input=$(cat)

# Loop guard: if this Stop was itself triggered by a prior Stop-hook block,
# don't block again — otherwise an unfixable error traps the session.
if [ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$PROJECT_DIR" || exit 0

# Skip the (whole-program, slow) typecheck unless TS sources actually changed.
changed=$(
  {
    git diff --name-only HEAD -- '*.ts' '*.tsx'
    git ls-files --others --exclude-standard -- '*.ts' '*.tsx'
  } 2>/dev/null
)
[ -z "$changed" ] && exit 0

if ! output=$(pnpm typecheck 2>&1); then
  echo "Typecheck failed — resolve these errors before finishing:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
