#!/bin/bash
set -euo pipefail

# PreToolUse hook: blocks AI agent access to sensitive files.
# Exit 0 = allow, Exit 2 = block (message shown to agent).

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty')

# Check a file path against sensitive patterns.
# Returns 0 (match = sensitive), 1 (no match = safe).
is_sensitive_path() {
  local path="$1"
  local filename="${path##*/}"

  # Allow non-sensitive env files
  case "$filename" in
    .env.example|.env.test|.env.development) return 1 ;;
  esac

  # Block sensitive patterns
  case "$filename" in
    .env|.env.local|.env.production) return 0 ;;
    credentials*|secrets*) return 0 ;;
    *.pem|*.key|*.p12|*.pfx) return 0 ;;
  esac

  return 1
}

case "$TOOL_NAME" in
  Read|Edit|Write)
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')
    if [ -n "$FILE_PATH" ] && is_sensitive_path "$FILE_PATH"; then
      echo "Blocked: '$FILE_PATH' matches a sensitive file pattern." >&2
      exit 2
    fi
    ;;
  Glob)
    PATTERN=$(echo "$TOOL_INPUT" | jq -r '.pattern // empty')
    if [ -n "$PATTERN" ] && is_sensitive_path "$PATTERN"; then
      echo "Blocked: glob pattern '$PATTERN' targets a sensitive file." >&2
      exit 2
    fi
    ;;
  Grep)
    GREP_PATH=$(echo "$TOOL_INPUT" | jq -r '.path // empty')
    if [ -n "$GREP_PATH" ] && is_sensitive_path "$GREP_PATH"; then
      echo "Blocked: grep path '$GREP_PATH' targets a sensitive file." >&2
      exit 2
    fi
    ;;
  Bash)
    # For Bash, only block commands that directly read/write/cat sensitive files.
    # Avoid false positives from incidental mentions (e.g., git check-ignore test.key).
    COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // empty')
    if [ -n "$COMMAND" ]; then
      if echo "$COMMAND" | grep -qE '(cat|less|head|tail|more|source|nano|vim|vi|code)\s+\S*(\.env|credentials|secrets|\.pem|\.key|\.p12|\.pfx)'; then
        echo "Blocked: Bash command appears to access a sensitive file." >&2
        exit 2
      fi
      if echo "$COMMAND" | grep -qE '>\s*\S*(\.env|credentials|secrets|\.pem|\.key|\.p12|\.pfx)'; then
        echo "Blocked: Bash command appears to write to a sensitive file." >&2
        exit 2
      fi
    fi
    ;;
esac

exit 0
