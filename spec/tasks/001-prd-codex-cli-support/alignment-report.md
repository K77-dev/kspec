# Relatório de Alinhamento Semântico — 001-prd-codex-cli-support

**Data:** 2026-05-24  
**Escopo analisado:** commits `7455c3b..HEAD` (feature mergeada em `72431c8`, patches `1.2.1`/`1.2.2` e skill `kspec-pr-review` em `main`)  
**Estado do repositório:** working tree limpo em `main`; diff principal via `git diff 7455c3b..72431c8` (124 arquivos, +9460/−641 linhas)

---

## Alignment Score

**Score final: 88%**  
**Recomendação: APPROVED WITH WARNINGS**

### Fórmula auditável

| Etapa | Cálculo |
| --- | --- |
| Lista **R** (requisitos rastreados) | 25 RFs do PRD (RF1.1–RF6.4) |
| Pontos base | 24,5 / 25 = **98%** |
| Penalidade P1 | −5 — RF4.5 literal: `.claude/` ausente do tarball npm (`package.json#files`) |
| Penalidade P2 | −5 — Tech Spec R4: `enterprise-skills-check.md` não regenera `.codex/agents/*.toml` para skills enterprise |
| **Score após penalidades** | max(0, 98 − 10) = **88%** |

### Detalhamento dos pontos base

| ID | Classificação | Pontos | Evidência |
| --- | --- | --- | --- |
| RF1.1 | Atendido | 1 | Zero ocorrências de `@.claude/` em `.agents/` (grep) |
| RF1.2 | Atendido | 1 | `find .agents -type f` → 28 arquivos (≥ 23) |
| RF1.3 | Atendido | 1 | `find .claude -maxdepth 2 -type l` → 17 symlinks (≥ 12) |
| RF1.4 | Atendido | 1 | `install.ts` preserva `settings*.json` via `isRealFile()`; nunca converte em symlink |
| RF2.1 | Atendido | 1 | `AGENTS.md` lista skills com invocação `$kspec-<nome>` |
| RF2.2 | Atendido | 1 | Rules referenciadas por path `.agents/rules/` |
| RF2.3 | Atendido | 1 | Seção «Limitações conhecidas no Codex» em `AGENTS.md` |
| RF2.4 | Atendido | 1 | `AGENTS.md` e `CLAUDE.md` descrevem mesma arquitetura `.agents/` + discovery |
| RF3.1 | Atendido | 1 | `.codex/agents/*.toml` com `name`, `description`, `sandbox_mode`, `developer_instructions` |
| RF3.2 | Atendido | 1 | `task-runner` → `workspace-write`; `review-runner` → `read-only`; `qa-runner` → `workspace-write` |
| RF3.3 | Atendido | 1 | `install.ts` regenera TOMLs com hash compare (`readExistingHash`) |
| RF4.1 | Atendido | 1 | `install.ts` + testes `install.spec.ts` cobrem estrutura completa pós-`init` |
| RF4.2 | Atendido | 1 | Idempotência em `platform.ts` (`skipped-idempotent`) + testes |
| RF4.3 | Atendido | 1 | `isOnWindows()` + `linkOrCopy` usa cópia recursiva |
| RF4.4 | Atendido | 1 | `migration.ts` + `migration.spec.ts` |
| RF4.5 | **Parcial** | 0,5 | `package.json#files` inclui `.agents/`, `.codex/`, mas **não** `.claude/`; `npm pack --dry-run` não lista `.claude/`. Mitigação: `kspec init` cria `.claude/` via symlinks em runtime |
| RF5.1 | Atendido | 1 | `kspec-bootstrap/SKILL.md` §4 — pergunta de plataformas |
| RF5.2 | Atendido | 1 | Geração condicional `CLAUDE.bootstrap.md` / `AGENTS.bootstrap.md` |
| RF5.3 | Atendido | 1 | MCP opt-in com default **Não** |
| RF5.4 | Atendido | 1 | Template `.codex/config.toml` documentado na skill |
| RF5.5 | Atendido | 1 | Seção «Modo Não-Interativo (codex exec)» com abort claro |
| RF6.1 | Atendido | 1 | README §«Matriz de plataformas» |
| RF6.2 | Atendido | 1 | README §«Limitações conhecidas» + `AGENTS.md` |
| RF6.3 | Atendido | 1 | `kspec-version/SKILL.md` varre `.agents/skills/` e imprime plataformas |
| RF6.4 | Atendido | 1 | Release `1.2.0` entregue (`72431c8`); estado atual `1.2.2` com keywords `codex`/`openai-codex` |

---

## Requisitos atendidos

### F1 — Reestruturação `.agents/` (PRD §F1)
- Migração física de skills, agents, rules, templates e validation para `.agents/`.
- Symlinks em `.claude/` e `.codex/skills/` apontando para `.agents/`.
- Refs `@.agents/...` em todos os SKILL/AGENT (RF1.1).

### F2 — `AGENTS.md` (PRD §F2)
- Arquivo raiz completo com skills, agents, rules, MCP opt-in e limitações Codex.

### F3 — Agents TOML (PRD §F3)
- Três arquivos `.codex/agents/*.toml` gerados com sandbox correto e corpo do AGENT.md.

### F4 — CLI multiplataforma (PRD §F4)
- `src/lib/{agent-toml,platform,migration,install}.ts` implementados conforme Tech Spec.
- `init.ts` / `update.ts` refatorados para orquestração comum.
- Scripts `scripts/smoke.sh` e `scripts/prepublish-check.sh` + hook `prepublishOnly`.

### F5 — Bootstrap multiplataforma (PRD §F5)
- Skill `kspec-bootstrap` estendida com escolha de plataforma, MCP opt-in e abort em `codex exec`.

### F6 — Documentação e versionamento (PRD §F6)
- README, CLAUDE.md, `doc/release-checklist.md`, bump 1.2.0 entregue.

### Tasks 1.0–13.0
- Todas marcadas `[x]` em `tasks.md`; reviews individuais (`review_*.md`) documentam aprovação por task.

---

## Gaps encontrados

| Gap | Severidade | Evidência | Impacto |
| --- | --- | --- | --- |
| **RF4.5 — `.claude/` fora do tarball npm** | Média | `package.json#files` não lista `.claude/`; `npm pack --dry-run` sem entradas `.claude/` | Consumidor que espera tarball pré-montado (PRD §Distribuição) não recebe camada Claude pré-construída; fluxo `kspec init` compensa criando symlinks |
| **Tech Spec R4 — TOML enterprise não regenerado** | Média | `enterprise-skills-check.md` não menciona `.codex/agents/*.toml`; algoritmo só copia skill + symlink | Skill enterprise futura com agent próprio pode não ganhar TOML Codex automaticamente |
| **E2E Codex/Claude não automatizado** | Baixa (documentado) | Tech Spec §Testes E2E substituído por checklist manual em `doc/release-checklist.md` | Risco de regressão de discovery/invocação só detectável manualmente pré-release |
| **Smoke script fora de CI** | Baixa | `scripts/smoke.sh` existe; não há job GitHub Actions correspondente | Smoke depende de execução manual (`npm link` + `npm run smoke`) |

Nenhum gap **crítico** de requisito de negócio não implementado foi identificado.

---

## Funcionalidades fora do escopo

Alterações em `main` **após** o merge da feature (`72431c8`), sem âncora no PRD deste slug:

| Item | Commit | Observação |
| --- | --- | --- |
| Skill `kspec-pr-review` | `f299897` | Nova skill (10ª); PRD previa 9 skills |
| Template `pr-template.md` | `f299897` | Suporte à skill acima |
| Fallback `request_user_input` / AskUserQuestion | `1353a8d`–`4b28e48` | Melhoria pós-release; alinha Codex interativo, não estava no PRD original |
| Patches `1.2.1` / `1.2.2` enterprise validation | `d59b848`, `8afeb43` | Correções operacionais pós-1.2.0 |

Remoção de `adr-template.md` (git status inicial) — verificar se intencional em commit separado; não rastreado nas tasks 1–13.

---

## Riscos detectados

| Risco | Origem | Mitigação existente |
| --- | --- | --- |
| **R1 — npm pack sem `.claude/`** | RF4.5 parcial | `install.ts` recria `.claude/` no projeto-alvo; `prepublish-check.sh` valida symlinks no repo publisher |
| **R2 — Drift tarball vs `.agents/`** | Tech Spec R5 | Hook `prepublishOnly` + `prepublish-check.sh` |
| **R3 — TOML grande (qa-runner ~235 linhas)** | Tech Spec R3 | Smoke E2E manual documentado em `release-checklist.md` |
| **R4 — Windows cópia vs symlink** | PRD §Restrições | Documentado em README/AGENTS.md; `linkOrCopy` implementado |
| **R5 — `codex exec` não-interativo** | Fora de escopo MVP | Documentado; fallback AskUserQuestion adicionado pós-release |

---

## Cobertura de testes

| Área | Evidência | Lacuna |
| --- | --- | --- |
| **Unitário — agent-toml** | `tests/agent-toml.spec.ts` | — |
| **Unitário — platform** | `tests/platform.spec.ts` | — |
| **Unitário — migration** | `tests/migration.spec.ts` | — |
| **Integração — install/init/update** | `tests/install.spec.ts`, `tests/commands.spec.ts` | — |
| **Smoke shell** | `scripts/smoke.sh` (manual, requer `npm link`) | Não encontrado job CI automatizado |
| **E2E Claude/Codex** | `doc/release-checklist.md` (8 cenários manuais) | Inferência: não há testes E2E automatizados (conforme Tech Spec) |
| **Enterprise TOML regen** | — | Não foram encontrados testes para regeneração de `.toml` pós-install enterprise skill |

**Execução local (2026-05-24):** `npm test` → **99/99 testes passando** (8 arquivos Vitest).

---

## Recomendação final

**APPROVED WITH WARNINGS**

A implementação entrega o suporte Codex CLI com arquitetura `.agents/` como source of truth, CLI multiplataforma, documentação e testes unitários/integração robustos. Os warnings referem-se a (1) omissão literal de `.claude/` no tarball npm e (2) lacuna na regeneração automática de TOMLs para agents enterprise — ambos mitigáveis sem bloquear o release histórico 1.2.0.

**Nota de contexto:** a feature já está mergeada em `main` (release `1.2.0` + patches). Este relatório documenta alinhamento retroativo para o slug `001-prd-codex-cli-support`.

---

## Validação de skills empresariais

✓ Artefatos empresariais validados — hashes locais em `enterprise-skills-lock.json` conferem com `.claude/.enterprise-skills-cache/skills-lock.json` (skill `cybersecurity-analyst` + 8 rules).
