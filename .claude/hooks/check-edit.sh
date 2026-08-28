#!/usr/bin/env bash
#
# PostToolUse hook: format, lint and test a file Claude just wrote.
#
# Reads the hook payload on stdin, formats the file in place, then reports any
# lint error or failing related test back to Claude (exit 2) so it is fixed in
# the same turn instead of surfacing at commit time.
#
# Formatting is applied silently — a reformat is not a problem to report, it is
# a problem already solved. Only lint and tests can fail in a way Claude has to
# act on.

set -uo pipefail

repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
bin="$repo/node_modules/.bin"

file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# Only source files. Markdown posts, JSON and config are none of oxfmt's,
# oxlint's or vitest's business, and running them costs a process each.
case "$file" in
  *.ts | *.tsx | *.mts | *.cts | *.js | *.jsx | *.mjs) ;;
  *) exit 0 ;;
esac

cd "$repo" || exit 0

# oxfmt applies .oxfmtrc.json's ignorePatterns even to an explicitly named file,
# so vendored trees (src/components/ui) need no guard here.
"$bin/oxfmt" "$file" >/dev/null 2>&1

problems=""

if ! lint=$("$bin/oxlint" "$file" 2>&1); then
  problems+="oxlint:
$lint
"
fi

# `related` runs only the test files that import this one, so a multi-file edit
# stays fast; --passWithNoTests keeps a file with no test from reading as a
# failure.
if ! tests=$("$bin/vitest" related "$file" --run --passWithNoTests 2>&1); then
  problems+="vitest:
$tests
"
fi

[ -z "$problems" ] && exit 0

printf '%s\n' "$problems" >&2
exit 2
