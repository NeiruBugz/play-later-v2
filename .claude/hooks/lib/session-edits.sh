#!/usr/bin/env bash
# Sourced by Stop hooks. Several Claude sessions can share one working tree, so a
# gate that checks every uncommitted file blocks one session on another session's
# half-finished work. These helpers narrow the gate to what *this* session edited.

# Prints app-relative paths of TS/TSX files that this session (or its subagents)
# wrote via Edit/Write/MultiEdit and that are still uncommitted. Edits made through
# Bash (sed, heredocs) are invisible here — the gate does not see them.
#   $1 — hook input JSON (Stop hook stdin)
#   $2 — absolute app directory (savepoint-tanstack)
session_edited_ts_files() {
  local hook_input="$1" app_dir="$2"
  local transcript subagents_dir uncommitted

  transcript=$(echo "$hook_input" | jq -r '.transcript_path // empty')
  [ -f "$transcript" ] || return 0
  subagents_dir="${transcript%.jsonl}/subagents"

  uncommitted=$(
    {
      git -C "$app_dir" diff --name-only --relative HEAD -- '*.ts' '*.tsx'
      git -C "$app_dir" ls-files --others --exclude-standard -- '*.ts' '*.tsx'
    } 2>/dev/null | sort -u
  )
  [ -z "$uncommitted" ] && return 0

  {
    cat "$transcript"
    [ -d "$subagents_dir" ] && cat "$subagents_dir"/*.jsonl 2>/dev/null
  } \
    | jq -rR 'fromjson? | select(.type == "assistant") | .message.content[]?
        | select(.type == "tool_use" and (.name == "Edit" or .name == "Write" or .name == "MultiEdit"))
        | .input.file_path // empty' \
    | sort -u \
    | while IFS= read -r path; do
        case "$path" in
          "$app_dir"/*.ts | "$app_dir"/*.tsx) echo "${path#"$app_dir"/}" ;;
        esac
      done \
    | grep -Fxf <(echo "$uncommitted")
}
