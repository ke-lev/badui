#!/usr/bin/env bash
# Guards PRODUCT.md against silent rewrites.
#
# PRODUCT.md carries an `impeccable:product-schema` marker, so running the
# impeccable skill can regenerate it from a fresh interview and quietly undo
# confirmed product decisions. This does not forbid editing the file — it
# forces a confirmation prompt so a rewrite is always a deliberate choice.
#
# Guards Write/Edit by file path, and Bash by command shape, because file
# edits are frequently made with sed/python heredocs rather than the edit
# tools, and a path-only guard would miss those entirely.
set -uo pipefail

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // empty' 2>/dev/null) || exit 0

case "$tool" in
  Write|Edit|MultiEdit|NotebookEdit)
    target=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
    case "$target" in
      */PRODUCT.md|PRODUCT.md) ;;
      *) exit 0 ;;
    esac
    ;;
  Bash)
    cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)
    case "$cmd" in
      *PRODUCT.md*) ;;
      *) exit 0 ;;
    esac
    # Reading PRODUCT.md is fine. Only stop commands shaped like a write.
    case "$cmd" in
      *">"*|*"tee "*|*"sed -i"*|*python*|*perl*|*"mv "*|*"cp "*|*"rm "*|*truncate*|*"dd "*) ;;
      *) exit 0 ;;
    esac
    ;;
  *) exit 0 ;;
esac

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"PRODUCT.md records confirmed product decisions and carries an impeccable:product-schema marker, so a skill re-run can regenerate it and silently revert them. Confirm only if this rewrite is intended. If impeccable is regenerating the file, preserve: the open-library scale, 'Explain the component, never the joke', 'Each entry ships finished', and the Voice commitment permitting component documentation. AGENTS.md is the newer authority."}}
JSON
