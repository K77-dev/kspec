# Resumo de Tarefas de Implementação de Suporte ao OpenAI Codex CLI

**Legenda de tamanho**: P (< 2h) | M (2-4h) | G (4-8h) | GG (> 8h)

## Tarefas

- [x] 1.0 Reestruturar `.claude/` real para `.agents/` source of truth + symlinks + refs [G]
- [x] 2.0 Criar `AGENTS.md` raiz, fixtures `.codex/agents/*.toml` e symlinks `.codex/skills/` (depende: 1.0) [M]
- [x] 3.0 Atualizar `CLAUDE.md` e SKILL `kspec-version` para nova arquitetura (depende: 1.0) [P]
- [x] 4.0 Setup Vitest e scripts de teste [P]
- [x] 5.0 Implementar `src/lib/platform.ts` (`linkOrCopy`, `isOnWindows`) (depende: 4.0) [M]
- [x] 6.0 Implementar `src/lib/agent-toml.ts` (parser + render TOML) (depende: 4.0) [M]
- [x] 7.0 Implementar `src/lib/migration.ts` (detecção e confirmação de migração) (depende: 4.0) [M]
- [x] 8.0 Implementar `src/lib/install.ts` orquestrador (depende: 5.0, 6.0, 7.0) [G]
- [x] 9.0 Refatorar `init.ts`, `update.ts`, `paths.ts`, `prompt.ts` para usar `install.ts` (depende: 8.0, 2.0) [M]
- [x] 10.0 Estender SKILL `kspec-bootstrap` para multiplataforma + MCP opt-in (depende: 1.0) [M]
- [x] 11.0 Atualizar `package.json#files` e `README.md` com matriz e limitações (depende: 2.0, 9.0) [M]
- [x] 12.0 Criar `scripts/smoke.sh` e `scripts/prepublish-check.sh` + hook `prepublishOnly` (depende: 9.0) [M]
- [x] 13.0 Bump versão 1.1.3 → 1.2.0 e `doc/release-checklist.md` (depende: 11.0, 12.0) [P]
