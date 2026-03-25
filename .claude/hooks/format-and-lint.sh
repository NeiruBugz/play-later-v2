#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/Users/nailbadiullin/Developer/personal/play-later-v2/savepoint-app"

file=$(jq -r '.tool_input.file_path // .tool_response.filePath')

# Only process files inside savepoint-app
case "$file" in
  "$PROJECT_DIR"/*)
    ext="${file##*.}"
    if echo "$ext" | grep -qE '^(ts|tsx|js|jsx|mdx|css|json)$'; then
      cd "$PROJECT_DIR"
      pnpm exec prettier --write "$file" --cache 2>/dev/null || true
      pnpm exec eslint --fix "$file" 2>/dev/null || true
    fi
    ;;
esac
