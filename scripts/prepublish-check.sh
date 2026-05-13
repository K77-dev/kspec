#!/usr/bin/env bash
# prepublish-check.sh — Valida que symlinks em .claude/ e .codex/ resolvem para .agents/
#
# Mitiga R5: drift entre .agents/, .claude/ e .codex/ no tarball.
# Chamado automaticamente via hook prepublishOnly antes de npm publish.
#
# Exit 0 = todos os symlinks ok
# Exit 1 = algum symlink quebrado ou aponta fora de .agents/

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PASS=0
FAIL=0

check_symlink() {
  local link="$1"
  local target
  if ! target=$(readlink -f "$link" 2>/dev/null); then
    echo "✗ Symlink nao resolve: $link"
    FAIL=$((FAIL + 1))
    return
  fi
  if [ -z "$target" ]; then
    echo "✗ Symlink quebrado: $link (readlink retornou vazio)"
    FAIL=$((FAIL + 1))
    return
  fi
  local agents_path="$REPO_ROOT/.agents"
  if [[ "$target" == "$agents_path"* ]]; then
    echo "✓ $link"
    PASS=$((PASS + 1))
  else
    echo "✗ $link → $target (nao aponta para .agents/)"
    FAIL=$((FAIL + 1))
  fi
}

echo "→ Verificando symlinks em .claude/ e .codex/..."
echo ""

# Symlinks de diretorio em .claude/ (rules, templates, validation)
for dir_link in .claude/rules .claude/templates .claude/validation; do
  if [ -L "$dir_link" ]; then
    check_symlink "$dir_link"
  fi
done

# Symlinks individuais em .claude/skills/
if [ -d ".claude/skills" ]; then
  while IFS= read -r -d '' link; do
    check_symlink "$link"
  done < <(find .claude/skills -maxdepth 1 -type l -print0 2>/dev/null)
fi

# Symlinks individuais em .claude/agents/
if [ -d ".claude/agents" ]; then
  while IFS= read -r -d '' link; do
    check_symlink "$link"
  done < <(find .claude/agents -maxdepth 1 -type l -print0 2>/dev/null)
fi

# Symlinks individuais em .codex/skills/
if [ -d ".codex/skills" ]; then
  while IFS= read -r -d '' link; do
    check_symlink "$link"
  done < <(find .codex/skills -maxdepth 1 -type l -print0 2>/dev/null)
fi

echo ""
echo "--- Resultados: $PASS passou(aram), $FAIL falhou(aram) ---"

if [ "$FAIL" -gt 0 ]; then
  echo "✗ Prepublish check falhou. Corrija os symlinks antes de publicar."
  exit 1
fi

echo "✓ Todos os symlinks resolvem para .agents/ — ok para publicar."
