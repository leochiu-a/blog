#!/usr/bin/env bash
# Run an agy prompt with host-scoped read_url permission, then put the CLI's
# settings file back exactly as it was — including when the run fails.
#
#   with-read-url.sh <prompt-file> <output-file> <host> [host...]
#
# Hosts are bare (pnpm.io), and become read_url(https://pnpm.io/*) rules in
# ~/.gemini/antigravity-cli/settings.json, which is the only file the CLI reads
# permissions from. Never replace this with --dangerously-skip-permissions:
# that approves every tool, shell commands included.
set -euo pipefail

prompt_file=$1; out_file=$2; shift 2
[ $# -gt 0 ] || { echo "need at least one host" >&2; exit 2; }

settings="$HOME/.gemini/antigravity-cli/settings.json"
backup=$(mktemp)
cp "$settings" "$backup"
trap 'cp "$backup" "$settings"; rm -f "$backup"; echo "restored $settings" >&2' EXIT

python3 - "$settings" "$@" <<'PY'
import json, sys
path, hosts = sys.argv[1], sys.argv[2:]
with open(path, encoding="utf-8") as f:
    settings = json.load(f)
settings.setdefault("permissions", {})["allow"] = [f"read_url(https://{h}/*)" for h in hosts]
with open(path, "w", encoding="utf-8") as f:
    json.dump(settings, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

~/.local/bin/agy -p "$(cat "$prompt_file")" \
  --model "${AGY_MODEL:-gemini-3.8-flash-high}" \
  --print-timeout "${AGY_TIMEOUT:-8m}" > "$out_file"
