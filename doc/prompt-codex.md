# Plano — Adaptar kspec para também suportar OpenAI Codex CLI

## Contexto

Hoje o **kspec** suporta apenas Claude Code via `.claude/` (apesar do `CLAUDE.md` declarar que `.agents/` é o source of truth — declaração não cumprida na prática). O objetivo é estender o suporte ao **OpenAI Codex CLI** sem duplicar conteúdo e sem quebrar o suporte atual.

**Insight-chave**: o Codex CLI já varre `.agents/skills/` nativamente (prioridade 2 na ordem de discovery, antes de `.codex/skills/`). Logo, **promover `.agents/` a source of truth real** entrega Codex "de graça" para o componente principal (skills), e fica a cargo do projeto apenas:
- traduzir os 3 agents (Markdown → TOML, formato exigido pelo Codex)
- criar `AGENTS.md` raiz (equivalente ao `CLAUDE.md`)
- manter `.claude/` e `.codex/` como camadas finas de discovery por symlinks

Restrições importantes do Codex já confirmadas:
- Frontmatter aceito: `name` + `description` mandatórios. `version` e `argument-hint` são ignorados (não geram erro) — mantidos para não regredir UX do Claude Code.
- **Sem `/<comando>` de projeto** — skills são invocadas via linguagem natural ou `$<nome-skill>`. Documentado.
- **Sem `AskUserQuestion` em `codex exec`** (modo não-interativo) — 6 skills do kspec usam. Em modo interativo (`codex`), funciona via `ask_user_question`.
- Codex não tem conceito de "rules" — referenciadas via caminho dentro de `AGENTS.md`.
- MCP config em TOML (`.codex/config.toml`).

## Visão geral

```
kspec/
├── AGENTS.md                      # NOVO — equivalente ao CLAUDE.md (raiz)
├── CLAUDE.md                      # mantido
├── .agents/                       # NOVO — source of truth real
│   ├── skills/<nome>/SKILL.md     # 9 skills
│   ├── agents/<nome>/AGENT.md     # 3 agents (fonte para gerar .toml)
│   ├── rules/*.md                 # 4 rules
│   ├── templates/*.md             # 5 templates
│   └── validation/
│       └── enterprise-skills-check.md
├── .claude/
│   ├── skills/<nome>              # symlink → ../../.agents/skills/<nome>
│   ├── agents/<nome>              # symlink → ../../.agents/agents/<nome>
│   ├── rules                      # symlink → ../.agents/rules
│   ├── templates                  # symlink → ../.agents/templates
│   ├── validation                 # symlink → ../.agents/validation
│   ├── settings.json              # mantido (não é symlink)
│   └── settings.local.json
├── .codex/                        # NOVO
│   ├── skills/<nome>              # symlink → ../../.agents/skills/<nome>
│   ├── agents/<nome>.toml         # gerado da CLI (a partir de .agents/agents/<nome>/AGENT.md)
│   └── config.toml                # opcional (MCP servers)
└── enterprise-skills-lock.json
```

**Decisões consolidadas**:
- Estratégia: unificar em `.agents/`, com `.claude/` e `.codex/` como camadas de discovery por symlinks.
- PRs: 3 sequenciais e independentemente revertíveis.
- Rules: referenciadas por caminho dentro de `AGENTS.md` (não embutidas, não duplicadas).
- `kspec-bootstrap`: pergunta antes via `AskUserQuestion` ("Quais plataformas suportar? Claude Code / Codex CLI / ambas"). Gera só o solicitado.

---

## PR-1 — Migração estrutural

Habilita Codex manualmente (sem mudanças na CLI).

### Passo 1.1 — Criar `.agents/` como diretório real e copiar conteúdo

Não fazer `git mv` direto: o Claude Code precisa continuar funcionando durante a transição (passos 1.2 e 1.3 alteram referências antes do symlink). Estratégia: **cópia primeiro, symlink depois**.

```
.agents/skills/<nome>/SKILL.md     ← copiar de .claude/skills/<nome>/SKILL.md (9 skills)
.agents/agents/<nome>/AGENT.md     ← copiar de .claude/agents/<nome>/AGENT.md (3 agents)
.agents/rules/*.md                  ← copiar de .claude/rules/ (4 arquivos)
.agents/templates/*.md              ← copiar de .claude/templates/ (5 arquivos)
.agents/validation/enterprise-skills-check.md ← copiar de .claude/validation/
```

Verificação: `find .agents -type f | wc -l` retorna **22**.

### Passo 1.2 — Substituir refs `@.claude/...` → `@.agents/...`

22 ocorrências confirmadas (editar nas cópias em `.agents/`, não em `.claude/`):

- `.agents/skills/kspec-prd/SKILL.md`: linhas 20, 59, 82
- `.agents/skills/kspec-techspec/SKILL.md`: linhas 30, 71, 129, 159
- `.agents/skills/kspec-tasks/SKILL.md`: linhas 66, 100, 102, 107, 111
- `.agents/skills/kspec-implement/SKILL.md`: linha 67
- `.agents/skills/kspec-bootstrap/SKILL.md`: linhas 68, 189
- `.agents/skills/kspec-bugfix/SKILL.md`: linhas 35, 70
- `.agents/skills/kspec-ideia/SKILL.md`: linha 90
- `.agents/skills/kspec-qa/SKILL.md`: linha 47
- `.agents/agents/kspec-task-runner/AGENT.md`: linhas 24, 59
- `.agents/agents/kspec-review-runner/AGENT.md`: linhas 24, 59
- `.agents/agents/kspec-qa-runner/AGENT.md`: linhas 35, 71

Verificação: `grep -r "@\.claude" .agents/` retorna vazio. Skills/agents em `.claude/` ainda apontam para `@.claude/...` neste momento (cópias intactas) — Claude Code continua funcional.

### Passo 1.3 — Criar `AGENTS.md` na raiz

Arquivo novo `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/AGENTS.md`. Conteúdo:

- Cabeçalho idêntico ao `CLAUDE.md` (descreve o projeto kspec)
- Substituições de paths: `.claude/skills/` → `.agents/skills/`, idem para agents/rules/templates
- Seção "Skills disponíveis" listando invocação por plataforma:
  - Claude Code: `/kspec-prd`, `/kspec-techspec`, ...
  - Codex CLI: `$kspec-prd ...` ou linguagem natural ("crie um PRD para...")
- Seção "Regras do projeto" listando caminhos:
  ```
  - .agents/rules/code-standards.md
  - .agents/rules/database.md
  - .agents/rules/logging.md
  - .agents/rules/graphify.md
  ```
- Seção "Limitações conhecidas no Codex":
  - `codex exec` (não-interativo) não suporta perguntas. Skills que usam `AskUserQuestion` (kspec-prd, kspec-bootstrap, kspec-techspec, kspec-tasks, kspec-implement, kspec-bugfix) só funcionam em modo interativo.
  - Não há slash command de projeto. Use `$kspec-<nome>` ou linguagem natural.
  - MCP servers (context7, testsprite) precisam estar em `.codex/config.toml` ou `~/.codex/config.toml`.

### Passo 1.4 — Gerar `.codex/agents/*.toml` (manualmente nesta fase)

Para cada um dos 3 agents (`kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`), criar `.codex/agents/<nome>.toml`:

```toml
name = "kspec-task-runner"
description = "Implementa uma tarefa de desenvolvimento específica..."  # do frontmatter do AGENT.md
sandbox_mode = "workspace-write"  # task-runner escreve; review-runner = "read-only"; qa-runner = "workspace-write"

developer_instructions = """
[corpo do AGENT.md sem o frontmatter YAML]
"""
```

Dimensões reais (caben confortavelmente em `developer_instructions`):
- `kspec-task-runner`: 137 linhas
- `kspec-review-runner`: 232 linhas
- `kspec-qa-runner`: 236 linhas

Mapeamento de `sandbox_mode`:
- `kspec-task-runner` → `workspace-write` (cria/edita código)
- `kspec-review-runner` → `read-only` (apenas lê e relata)
- `kspec-qa-runner` → `workspace-write` (executa testes que podem gerar artefatos)

### Passo 1.5 — Substituir `.claude/` por symlinks (ponto de não-retorno)

Para cada skill/agent:
```
rm -rf .claude/skills/<nome>
ln -sfn ../../.agents/skills/<nome> .claude/skills/<nome>
```

Para rules/templates/validation (diretórios inteiros):
```
rm -rf .claude/rules
ln -sfn ../.agents/rules .claude/rules
# idem para templates e validation
```

Manter intactos (NÃO symlinkar): `.claude/settings.json`, `.claude/settings.local.json`.

Criar também os symlinks de `.codex/skills/<nome>` (Codex já leria de `.agents/`, mas o symlink expõe via `$REPO_ROOT/.codex/skills` que é prioridade 3 e ajuda quando o usuário usa `--cwd` de um subdiretório):
```
mkdir -p .codex/skills
ln -sfn ../../.agents/skills/<nome> .codex/skills/<nome>
```

Verificação:
- `find .claude -maxdepth 2 -type l | wc -l` ≥ 12 (9 skills + 3 agents)
- `find .claude/rules -follow -type f | wc -l` → 4
- Invocar `/kspec-version` no Claude Code (sanidade)
- Invocar `$kspec-version` ou linguagem natural no Codex CLI

### Passo 1.6 — Atualizar `CLAUDE.md`

- Linha que descreve estrutura do projeto: substituir `.claude/skills/` por `.agents/skills/` etc. e explicar que `.claude/` e `.codex/` são camadas de discovery (symlinks).
- Remover menção a `.github/` que não existe (linha 27).
- Adicionar nota: "AGENTS.md (raiz) é o equivalente para Codex CLI".

### Arquivos criados/modificados no PR-1

Novos:
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/AGENTS.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.agents/` (22 arquivos)
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.codex/agents/kspec-task-runner.toml`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.codex/agents/kspec-review-runner.toml`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.codex/agents/kspec-qa-runner.toml`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.codex/skills/<nome>` × 9 (symlinks)

Modificados:
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/CLAUDE.md`
- Toda a estrutura `.claude/skills/`, `.claude/agents/`, `.claude/rules`, `.claude/templates`, `.claude/validation` vira symlink

---

## PR-2 — CLI + bootstrap

### Passo 2.1 — Atualizar `src/commands/init.ts`

Funcionalidade atual: copia `.claude/` para o projeto-alvo.

Nova lógica:
1. Copiar `.agents/` para o projeto-alvo (source of truth)
2. Para cada `<nome>` em `.agents/skills/`:
   - Criar symlink `.claude/skills/<nome>` → `../../.agents/skills/<nome>` no projeto-alvo
   - Criar symlink `.codex/skills/<nome>` → `../../.agents/skills/<nome>` no projeto-alvo
3. Para cada `<nome>` em `.agents/agents/`:
   - Criar symlink `.claude/agents/<nome>` → `../../.agents/agents/<nome>`
   - **Gerar** `.codex/agents/<nome>.toml` a partir de `.agents/agents/<nome>/AGENT.md` (parse frontmatter + corpo)
4. Symlinks de diretório para `rules`, `templates`, `validation` (em `.claude/`)
5. Copiar `AGENTS.md` template para a raiz (se não existir)

Helper a criar: `src/lib/toml-from-agent.ts` — recebe path do `AGENT.md`, retorna string TOML. Lê frontmatter (`name`, `description`), pega corpo, monta TOML com `developer_instructions = """..."""`. Mapeia `sandbox_mode` por convenção: se `<nome>` contém `review` → `read-only`, senão → `workspace-write`.

Fallback Windows (`process.platform === 'win32'`): em vez de symlink, **copiar arquivos**. Documentar limitação.

### Passo 2.2 — Atualizar `src/commands/update.ts`

Aplica a mesma lógica do `init.ts`, regenera os `.codex/agents/*.toml` para incorporar mudanças no `.agents/agents/<nome>/AGENT.md` upstream.

### Passo 2.3 — Atualizar `package.json`

```json
"files": [
  "dist/",
  ".agents/",
  ".claude/",
  ".codex/",
  "AGENTS.md",
  "VERSION",
  "README.md"
]
```

`description` muda para: `"Kit de specs e padrões para projetos com agentes de IA (Claude Code, OpenAI Codex CLI)"`.

`keywords`: adicionar `"codex"`, `"openai-codex"`.

### Passo 2.4 — Atualizar `.agents/skills/kspec-bootstrap/SKILL.md`

Adicionar passo inicial via `AskUserQuestion`:
```
Pergunta: "Quais plataformas devem ser configuradas neste projeto?"
Opções:
- Claude Code apenas
- Codex CLI apenas
- Ambas (Recomendado)
```

Conforme resposta:
- Claude Code: gerar `CLAUDE.bootstrap.md` (comportamento atual)
- Codex CLI: gerar `AGENTS.bootstrap.md`
- Ambas: gerar os dois

Após a primeira pergunta, se Codex foi selecionado, perguntar:
```
"Registrar MCP servers do kspec (context7, testsprite) em .codex/config.toml?"
Opções: Sim / Não (default)
```

Se sim, gerar `.codex/config.toml` com:
```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.testsprite]
command = "npx"
args = ["-y", "@testsprite/testsprite-mcp"]
```

### Passo 2.5 — Atualizar `.agents/validation/enterprise-skills-check.md`

Algoritmo atual (resumo): copia skills empresariais para `.agents/`, cria symlink em `.claude/`.

Adicionar terceiro symlink no Step 5:
```
ln -sfn ../../.agents/skills/<nome> .codex/skills/<nome>
mkdir -p .codex/skills  # garantir antes
```

E após gerar/atualizar uma skill enterprise que tenha um AGENT correspondente (caso aplicável), regerar o `.codex/agents/<nome>.toml`.

### Arquivos modificados no PR-2

- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/src/commands/init.ts`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/src/commands/update.ts`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/src/lib/toml-from-agent.ts` (novo)
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/package.json`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.agents/skills/kspec-bootstrap/SKILL.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.agents/validation/enterprise-skills-check.md`

---

## PR-3 — Housekeeping

### Passo 3.1 — `.agents/skills/kspec-version/SKILL.md`

Mudar a varredura de `.claude/skills/*/SKILL.md` para `.agents/skills/*/SKILL.md` (fonte canônica agora).
Adicionar linha no output: `Plataformas suportadas: Claude Code, OpenAI Codex CLI`.

### Passo 3.2 — `README.md`

- Cabeçalho: trocar "para **Claude Code**" por "para **Claude Code** e **OpenAI Codex CLI**"
- Adicionar tabela "Matriz de plataformas":

| Plataforma | Skills | Agents | Rules | Templates | Invocação |
|---|---|---|---|---|---|
| Claude Code | `.agents/skills/` via symlink em `.claude/` | `.agents/agents/` via symlink | `.agents/rules/` via symlink | idem | `/kspec-<nome>` |
| OpenAI Codex CLI | `.agents/skills/` (nativo) | `.codex/agents/<nome>.toml` | referenciado em `AGENTS.md` | referenciado em `AGENTS.md` | `$kspec-<nome>` ou NL |

- Seção "Limitações conhecidas no Codex": copiar do `AGENTS.md`.

### Passo 3.3 — Bump de versão

`package.json`: `1.1.3` → `1.2.0` (minor: novo target de plataforma).
`VERSION`: `1.1.3` → `1.2.0`.

### Arquivos modificados no PR-3

- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.agents/skills/kspec-version/SKILL.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/README.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/package.json`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/VERSION`

---

## Verificação end-to-end

### Após PR-1
- [ ] `find .agents -type f | wc -l` → 22
- [ ] `find .claude -maxdepth 2 -type l | wc -l` ≥ 12
- [ ] `find .claude/rules -follow -type f | wc -l` → 4
- [ ] `grep -r "@\.claude" .agents/` → vazio
- [ ] Claude Code: invocar `/kspec-version` no projeto kspec — funciona, lista skills
- [ ] Claude Code: invocar `/kspec-prd test` — abre o template corretamente (valida resolução de symlinks)
- [ ] Codex CLI: `cd /Users/kelsen/Documents/develpment/git/k77-dev/kspec && codex` — exibe `AGENTS.md` carregado
- [ ] Codex CLI: digitar `$kspec-version` ou "qual a versão do kspec" — skill é encontrada e executa
- [ ] Codex CLI: invocar `$kspec-task-runner` em uma task de teste — TOML é carregado corretamente

### Após PR-2
- [ ] `npm pack` mostra `.agents/`, `.claude/`, `.codex/`, `AGENTS.md` no tarball
- [ ] Em `/tmp/test-proj/` vazio: `npm link && kspec init` — gera `.agents/` real, `.claude/` com symlinks, `.codex/` com symlinks + `.toml`, `AGENTS.md`, `CLAUDE.md`
- [ ] `kspec init` em projeto com `.claude/` real (não symlink) — pergunta antes de sobrescrever, não destrói trabalho do usuário
- [ ] `/kspec-bootstrap` num projeto-alvo: pergunta sobre plataformas; se "Ambas", gera os 2 arquivos
- [ ] `/kspec-bootstrap` com MCP=Sim: gera `.codex/config.toml` com context7 e testsprite
- [ ] No Windows (se disponível): `kspec init` faz cópia em vez de symlink

### Após PR-3
- [ ] `/kspec-version` lista "Plataformas: Claude Code, OpenAI Codex CLI"
- [ ] README renderiza no GitHub sem links quebrados
- [ ] `npm view @k77-dev/kspec version` → `1.2.0`
- [ ] Smoke test em projeto novo após `npm i -g @k77-dev/kspec@1.2.0`

---

## Limitações conhecidas (documentar em AGENTS.md e README)

1. **`codex exec` não interativo**: 6 skills (`kspec-prd`, `kspec-techspec`, `kspec-tasks`, `kspec-implement`, `kspec-bugfix`, `kspec-bootstrap`) usam `AskUserQuestion` e só funcionam em modo interativo (`codex` na TUI). Em CI, falham/pulam perguntas. Fora de escopo deste plano substituir esse mecanismo.
2. **Sem slash command de projeto no Codex**: `$kspec-<nome>` ou linguagem natural em vez de `/kspec-<nome>`.
3. **Windows e symlinks**: a CLI faz fallback para cópia, mas sincronização manual depois fica a cargo do usuário. Documentado.
4. **MCP context7/testsprite**: precisam ser registrados em `~/.codex/config.toml` ou via `kspec-bootstrap` com opt-in. Não há descoberta automática.
5. **Sandbox dos agents Codex**: `kspec-task-runner` e `kspec-qa-runner` precisam de `workspace-write`. Se o usuário rodar com `--sandbox read-only`, esses agents falham. Documentado.

---

## Fora de escopo (decisão deliberada)

- Reescrever skills para usar APIs específicas do Codex (não há — são Markdown)
- Mudar templates (`prd-template.md`, etc.) — são neutros
- Substituir `AskUserQuestion` por mecanismo agnóstico (trabalho grande, outro PR)
- Suporte a GitHub Copilot Workspace / Cursor / Cline
- Resolver symlinks no Windows via `mklink` nativo (fallback de cópia basta)
- Auto-detectar `codex` no PATH (decisão: bootstrap pergunta sempre)

---

## Arquivos críticos (referência rápida)

- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/CLAUDE.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/package.json` (linhas 12-17 e 23-29)
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/src/commands/init.ts`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/src/commands/update.ts`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.claude/validation/enterprise-skills-check.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.claude/skills/kspec-bootstrap/SKILL.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/.claude/skills/kspec-version/SKILL.md`
- `/Users/kelsen/Documents/develpment/git/k77-dev/kspec/README.md`

22 arquivos com refs `@.claude/...` a editar (lista completa em **Passo 1.2**).
