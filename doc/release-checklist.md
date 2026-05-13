# Release Checklist — kspec v1.2.0

Checklist de verificações manuais E2E antes de executar `npm publish`.
Itens automatizáveis são cobertos por `npm run smoke` e `npm run build`.
Os itens abaixo exigem instalação local dos CLIs `claude` e/ou `codex`.

## Pré-requisitos

- [ ] `npm run build` passou sem erros
- [ ] `npm run smoke` (script `scripts/smoke.sh`) passou com todos os asserts verdes
- [ ] `bash scripts/prepublish-check.sh` passou — todos os symlinks resolvem para `.agents/`
- [ ] Tasks 11.0 (smoke + testes) e 12.0 (docs) aprovadas

---

## 1. Claude Code — Verificação de Skills

**Objetivo:** confirmar que as 9 skills do kspec são listadas e invocáveis via Claude Code.

**Passos:**
1. Abrir Claude Code no diretório do projeto
2. Digitar `/kspec-version`

**Resultado esperado:** saída lista exatamente 9 skills (`kspec-ideia`, `kspec-prd`, `kspec-techspec`, `kspec-tasks`, `kspec-implement`, `kspec-qa`, `kspec-bugfix`, `kspec-bootstrap`, `kspec-version`) e exibe "Plataformas suportadas: Claude Code, OpenAI Codex CLI".

- [ ] Passou

---

## 2. Claude Code — Resolução de Template via Symlink

**Objetivo:** confirmar que skills resolvem templates via symlink `.claude/templates` → `.agents/templates`.

**Passos:**
1. Abrir Claude Code no diretório do projeto
2. Digitar `/kspec-prd test`

**Resultado esperado:** a skill carrega sem erro de template; produz PRD de rascunho usando o template `prd-template.md` resolvido via symlink.

- [ ] Passou

---

## 3. Codex CLI — Carregamento de AGENTS.md

**Objetivo:** confirmar que o Codex CLI carrega `AGENTS.md` automaticamente ao iniciar sessão interativa.

**Passos:**
1. Navegar até um projeto-alvo onde `kspec init` foi executado (ou a raiz do próprio kspec)
2. Executar: `codex`

**Resultado esperado:** o contexto exibido na sessão interativa inclui o conteúdo de `AGENTS.md` (lista de skills, formas de invocação, limitações conhecidas no Codex).

- [ ] Passou

---

## 4. Codex CLI — Invocação de skill `$kspec-version`

**Objetivo:** confirmar que o Codex CLI encontra e executa a skill `kspec-version`.

**Passos:**
1. Dentro da sessão interativa do Codex CLI (`codex`)
2. Digitar: `$kspec-version`

**Resultado esperado:** skill é encontrada em `.agents/skills/kspec-version/SKILL.md` (ou `.codex/skills/kspec-version/SKILL.md` via symlink) e executada com saída de versão e lista de skills.

- [ ] Passou

---

## 5. Codex CLI — Agent `$kspec-task-runner` com TOML e sandbox

**Objetivo:** confirmar que o agent `kspec-task-runner` é carregado pelo Codex CLI com `sandbox_mode = "workspace-write"`.

**Passos:**
1. Confirmar que `.codex/agents/kspec-task-runner.toml` existe e contém `sandbox_mode = "workspace-write"`
2. Dentro da sessão interativa do Codex CLI (`codex`)
3. Digitar: `$kspec-task-runner`

**Resultado esperado:** Codex CLI carrega o agent com as `developer_instructions` do TOML e aplica sandbox `workspace-write`. Nenhum erro de parse de TOML.

- [ ] Passou (TOML validado)
- [ ] Passou (agent executado com sandbox correto)

---

## 6. Smoke Shell Automatizado

**Objetivo:** validar asserts estruturais do projeto via script automatizado.

**Passos:**
```bash
npm run smoke
```

**Asserts verificados pelo script:**
- `find .agents -type f | wc -l ≥ 23`
- `find .claude -maxdepth 2 -type l | wc -l ≥ 12`
- `.codex/agents/kspec-task-runner.toml` existe
- `kspec-task-runner.toml` contém `sandbox_mode = "workspace-write"`
- `kspec-review-runner.toml` contém `sandbox_mode = "read-only"`
- `AGENTS.md` e `CLAUDE.md` existem

- [ ] Passou (todos os asserts verdes)

---

## 7. npm pack — Verificação do Tarball

**Objetivo:** confirmar que o tarball inclui `.agents/`, `.codex/` e `AGENTS.md`.

**Passos:**
```bash
npm pack --dry-run
```

**Resultado esperado:** a listagem de arquivos inclui entradas em `.agents/`, `.codex/` e o arquivo `AGENTS.md` na raiz. Nenhum arquivo sensível incluído inadvertidamente.

- [ ] `.agents/` listado
- [ ] `.codex/` listado (incluindo `agents/*.toml`)
- [ ] `AGENTS.md` listado

---

## 8. Verificação Pós-Publicação

**Objetivo:** confirmar que a versão publicada no npm registry está correta.

**Passos (executar após `npm publish`):**
```bash
npm view @k77-dev/kspec version
```

**Resultado esperado:** saída é exatamente `1.2.0`.

- [ ] `npm view @k77-dev/kspec version` = `1.2.0`

---

## Aprovação Final

| Item | Responsável | Status |
|------|-------------|--------|
| Build + testes unitários | CI / Publisher | [ ] |
| Smoke shell | Publisher | [ ] |
| Prepublish check (symlinks) | Publisher (auto via hook) | [ ] |
| E2E Claude Code (itens 1-2) | QA manual | [ ] |
| E2E Codex CLI (itens 3-5) | QA manual | [ ] |
| npm pack dry-run (item 7) | Publisher | [ ] |
| npm publish + verificação (item 8) | Publisher | [ ] |

**Release aprovada para publicação quando todos os itens estiverem marcados.**
