#!/usr/bin/env bash
set -uo pipefail

# Stop hook: gate turn completion on TypeScript errors in the files this session
# edited. tsc still checks the whole program; only the reported errors are scoped.
# Exit 0 = allow stop, Exit 2 = block stop and feed stderr back to Claude.

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$HOOKS_DIR/../.." && pwd)}/savepoint-tanstack"
# shellcheck source-path=SCRIPTDIR source=lib/session-edits.sh
source "$HOOKS_DIR/lib/session-edits.sh"

input=$(cat)

# Loop guard: if this Stop was itself triggered by a prior Stop-hook block,
# don't block again — otherwise an unfixable error traps the session.
if [ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$PROJECT_DIR" || exit 0

# Scoped to this session's edits so another session's half-finished work in the
# same tree does not block this one. Trade-off: an edit here that breaks a file
# this session never touched is left to CI.
edited=$(session_edited_ts_files "$input" "$PROJECT_DIR")
[ -z "$edited" ] && exit 0

output=$(pnpm exec tsc --noEmit --pretty false 2>&1) && exit 0

# tsc prints "path(line,col): error ..." followed by indented continuation lines.
own_errors=$(
  echo "$output" | awk -v files="$edited" '
    BEGIN { n = split(files, list, "\n"); for (i = 1; i <= n; i++) mine[list[i]] = 1 }
    /^[^ ]/ { path = $0; sub(/\(.*/, "", path); keep = (path in mine) }
    keep
  '
)
[ -z "$own_errors" ] && exit 0

echo "Typecheck failed in files this session edited — resolve these errors before finishing:" >&2
echo "$own_errors" >&2
exit 2
