#!/usr/bin/env bash
# smoke.sh — Integration smoke test for kspec init/update
#
# Prerequisites:
#   npm run build      (generate dist/)
#   npm link           (register kspec globally from this repo)
#
# Usage:
#   npm run smoke

set -euo pipefail

SMOKE_DIR="/tmp/kspec-smoke-$$"
MIGRATE_DIR="/tmp/kspec-smoke-migrate-$$"
PASS=0
FAIL=0

cleanup() {
  rm -rf "$SMOKE_DIR" "$MIGRATE_DIR"
}
trap cleanup EXIT

assert_gte() {
  local description="$1"
  local actual="$2"
  local expected="$3"
  if [ "$actual" -ge "$expected" ]; then
    echo "PASS  $description ($actual >= $expected)"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $description ($actual < $expected)"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_exists() {
  local description="$1"
  local file="$2"
  if [ -f "$file" ]; then
    echo "PASS  $description"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $description (arquivo ausente: $file)"
    FAIL=$((FAIL + 1))
  fi
}

assert_grep() {
  local description="$1"
  local file="$2"
  local pattern="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "PASS  $description"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $description (pattern nao encontrado em $file: $pattern)"
    FAIL=$((FAIL + 1))
  fi
}

assert_true() {
  local description="$1"
  if eval "$2"; then
    echo "PASS  $description"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $description"
    FAIL=$((FAIL + 1))
  fi
}

count_resolvable_agent_rules() {
  local count=0
  local rule
  for rule in .agents/rules/*.md; do
    [ -e "$rule" ] || continue
    if head -c 1 "$rule" &>/dev/null; then
      count=$((count + 1))
    fi
  done
  echo "$count"
}

capture_cursor_state() {
  {
    find .cursor -type l 2>/dev/null | sort | while IFS= read -r link; do
      echo "$link -> $(readlink "$link")"
    done
    find .cursor/rules -maxdepth 1 -name '*.mdc' -type f 2>/dev/null | sort | while IFS= read -r file; do
      md5 -q "$file" 2>/dev/null || md5sum "$file" | awk '{print $1}'
      echo "$file"
    done
  }
}

echo "=== smoke.sh: kspec integration smoke test ==="
echo ""

if ! command -v kspec &>/dev/null; then
  echo "✗ kspec nao encontrado no PATH."
  echo "  Execute: npm run build && npm link"
  exit 1
fi

echo "→ Cenario 1: kspec init em projeto vazio"
mkdir -p "$SMOKE_DIR"
cd "$SMOKE_DIR"
npm init -y --quiet >/dev/null 2>&1

echo "y" | kspec init 2>&1 || true

AGENTS_FILE_COUNT=$(find .agents -type f 2>/dev/null | wc -l | tr -d ' ')
assert_gte "find .agents -type f >= 23" "$AGENTS_FILE_COUNT" 23

CLAUDE_SYMLINK_COUNT=$(find .claude -maxdepth 2 -type l 2>/dev/null | wc -l | tr -d ' ')
assert_gte "find .claude -maxdepth 2 -type l >= 12" "$CLAUDE_SYMLINK_COUNT" 12

assert_file_exists ".codex/agents/kspec-task-runner.toml exists" ".codex/agents/kspec-task-runner.toml"
assert_grep "kspec-task-runner.toml tem sandbox_mode workspace-write" \
  ".codex/agents/kspec-task-runner.toml" \
  'sandbox_mode = "workspace-write"'
assert_grep "kspec-review-runner.toml tem sandbox_mode read-only" \
  ".codex/agents/kspec-review-runner.toml" \
  'sandbox_mode = "read-only"'
assert_true "AGENTS.md e CLAUDE.md existem" "[ -f AGENTS.md ] && [ -f CLAUDE.md ]"

CURSOR_SKILL_SYMLINK_COUNT=$(find .cursor/skills -maxdepth 1 -type l 2>/dev/null | wc -l | tr -d ' ')
assert_gte "find .cursor/skills -maxdepth 1 -type l >= 11" "$CURSOR_SKILL_SYMLINK_COUNT" 11

CURSOR_AGENT_SYMLINK_COUNT=$(find .cursor/agents -maxdepth 1 -type l 2>/dev/null | wc -l | tr -d ' ')
assert_gte "find .cursor/agents -maxdepth 1 -type l >= 3" "$CURSOR_AGENT_SYMLINK_COUNT" 3

RESOLVABLE_RULES=$(count_resolvable_agent_rules)
CURSOR_MDC_COUNT=$(find .cursor/rules -maxdepth 1 -name '*.mdc' -type f 2>/dev/null | wc -l | tr -d ' ')
assert_gte ".cursor/rules/*.mdc >= .agents/rules/*.md resolviveis" "$CURSOR_MDC_COUNT" "$RESOLVABLE_RULES"

assert_file_exists "CURSOR.md existe" "CURSOR.md"
assert_grep "code-standards.mdc tem alwaysApply: true" \
  ".cursor/rules/code-standards.mdc" \
  'alwaysApply: true'

echo ""
echo "→ Cenario 2: migracao — .claude/skills/ como dir real sem --force deve abortar"
mkdir -p "$MIGRATE_DIR"
cd "$MIGRATE_DIR"
npm init -y --quiet >/dev/null 2>&1

mkdir -p .claude/skills
echo "dummy" > .claude/skills/dummy.txt

MIGRATE_OUTPUT=$(echo "n" | kspec init 2>&1 || true)
if echo "$MIGRATE_OUTPUT" | grep -qiE "plano|migracao|migração|abortar|abortado|cancelad|abort"; then
  echo "PASS  migracao abortada com plano exibido"
  PASS=$((PASS + 1))
else
  echo "FAIL  kspec init nao exibiu plano de migracao ou nao abortou"
  echo "      Output: $MIGRATE_OUTPUT"
  FAIL=$((FAIL + 1))
fi

cd "$SMOKE_DIR"

echo ""
echo "→ Cenario 3: idempotencia — kspec update 2x seguidas deve produzir diff zero de symlinks"
kspec update 2>&1 || true
SYMLINKS_AFTER_FIRST=$(find . -type l | sort | xargs -I{} sh -c 'echo "{} -> $(readlink "{}")"' 2>/dev/null)
CURSOR_STATE_AFTER_FIRST=$(capture_cursor_state)
kspec update 2>&1 || true
SYMLINKS_AFTER_SECOND=$(find . -type l | sort | xargs -I{} sh -c 'echo "{} -> $(readlink "{}")"' 2>/dev/null)
CURSOR_STATE_AFTER_SECOND=$(capture_cursor_state)

if [ "$SYMLINKS_AFTER_FIRST" = "$SYMLINKS_AFTER_SECOND" ]; then
  echo "PASS  idempotencia: symlinks inalterados entre 1o e 2o update"
  PASS=$((PASS + 1))
else
  echo "FAIL  idempotencia: symlinks mudaram entre 1o e 2o update"
  FAIL=$((FAIL + 1))
fi

if [ "$CURSOR_STATE_AFTER_FIRST" = "$CURSOR_STATE_AFTER_SECOND" ]; then
  echo "PASS  idempotencia: .cursor/ (symlinks + .mdc) inalterado entre 1o e 2o update"
  PASS=$((PASS + 1))
else
  echo "FAIL  idempotencia: .cursor/ (symlinks + .mdc) mudou entre 1o e 2o update"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Resultados: $PASS passou(aram), $FAIL falhou(aram) ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
