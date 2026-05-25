# AGENTS.md

Guia para agentes de IA ao trabalhar com o código deste repositório — plataforma OpenAI Codex CLI.

Este projeto é o **kspec** — um kit de especificações e padrões para projetos desenvolvidos com agentes de IA. Contém skills, agents, rules e templates para Claude Code e OpenAI Codex CLI. **Não contém código de aplicação executável.**

> Para Claude Code, consulte `CLAUDE.md`.

## Visão Geral

O kspec padroniza o ciclo de vida de desenvolvimento com agentes de IA: da ideia à especificação, das tasks ao código revisado. O source of truth de todo o conteúdo (skills, agents, rules, templates) vive em `.agents/`. As plataformas Claude Code (`.claude/`) e Codex CLI (`.codex/`) apontam para `.agents/` via symlinks.

## Estrutura do projeto

```
/                                # Raiz do kspec
├── .agents/                     # Skills, agents, rules, templates (source of truth)
│   ├── skills/                  # Skills invocáveis
│   ├── agents/                  # Agents para automação
│   ├── rules/                   # Padrões por tecnologia
│   └── templates/               # Templates para artefatos
├── .claude/                     # Espelhos de .agents/ (symlinks) — Claude Code
├── .codex/                      # Espelhos de .agents/ (symlinks) — Codex CLI
│   ├── skills/                  # → .agents/skills/ (symlinks)
│   └── agents/                  # Arquivos .toml gerados (formato Codex)
├── .github/                     # GitHub Actions, instructions
├── spec/
│   └── tasks/                   # Artefatos gerados (PRDs, techspecs, tasks, reviews)
├── src/                         # Código-fonte principal
├── dist/                        # Build output
├── AGENTS.md                    # Este arquivo — guia para Codex CLI
├── CLAUDE.md                    # Guia equivalente para Claude Code
├── README.md                    # Documentação pública do projeto
└── VERSION                      # Versão do kspec
```

## Skills Disponíveis

Para invocar uma skill no Codex CLI, use `$kspec-<nome>` ou descreva a ação em linguagem natural. Os arquivos de skill estão em `.agents/skills/<nome>/SKILL.md`.

| Skill | Invocação Codex | Função |
| --- | --- | --- |
| `kspec-ideia` | `$kspec-ideia` ou "faça brainstorm de uma ideia" | Brainstorm/discovery para decompor ideia em módulos |
| `kspec-prd` | `$kspec-prd` ou "crie um PRD para..." | Cria PRD a partir de solicitação de funcionalidade |
| `kspec-techspec` | `$kspec-techspec` ou "crie a tech spec para..." | Traduz PRD em especificação técnica |
| `kspec-tasks` | `$kspec-tasks` ou "quebre em tasks..." | Quebra Tech Spec em tarefas incrementais |
| `kspec-implement` | `$kspec-implement` ou "implemente as tasks de..." | Executa todas as tasks pendentes |
| `kspec-qa` | `$kspec-qa` ou "execute QA de..." | Quality Assurance (E2E, acessibilidade) |
| `kspec-pr-review` | `$kspec-pr-review` ou "revisão semântica da entrega antes do PR" | Alinhamento PRD/Tech Spec/tasks × diff, relatório e corpo do PR |
| `kspec-bugfix` | `$kspec-bugfix` ou "corrija o bug documentado em..." | Corrige bugs documentados pelo QA |
| `kspec-bootstrap` | `$kspec-bootstrap` ou "configure o kspec neste projeto" | Gera configuração para projeto existente |
| `kspec-version` | `$kspec-version` ou "qual a versão do kspec?" | Exibe versão atual e lista skills/agents |

## Agents

Os agents são acionados automaticamente pelas skills. No Codex CLI, os agents são definidos em `.codex/agents/<nome>.toml`.

| Agent | Acionado por | Sandbox | Função |
| --- | --- | --- | --- |
| `kspec-task-runner` | `$kspec-implement` | `workspace-write` | Implementa uma task em contexto isolado |
| `kspec-review-runner` | `$kspec-implement` | `read-only` | Code review contra spec e rules |
| `kspec-qa-runner` | `$kspec-qa` | `workspace-write` | Testa E2E, acessibilidade, visual |

## Rules — Padrões de Código

As rules ficam em `.agents/rules/`. Consulte-as diretamente pelo caminho — o conteúdo não é duplicado aqui.

| Rule | Caminho | Escopo |
| --- | --- | --- |
| Padrões de código | `.agents/rules/code-standards.md` | Nomenclatura, formatação, SOLID |
| Banco de dados | `.agents/rules/database.md` | ORM, queries, migrations |
| Logging | `.agents/rules/logging.md` | Níveis e estrutura de log |
| Graphify | `.agents/rules/graphify.md` | Knowledge graph para análise |

## MCP Opt-in

O Codex CLI não descobre MCPs automaticamente. Para habilitar MCPs (context7, testsprite), crie ou edite `.codex/config.toml`:

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.testsprite]
command = "npx"
args = ["-y", "testsprite-mcp"]
```

Alternativamente, use `$kspec-bootstrap` em modo interativo — a skill perguntará se deseja registrar os MCPs.

## Limitações conhecidas no Codex

1. **Ausência de slash commands de projeto**: o Codex CLI não suporta slash commands de projeto (`/kspec-prd`). Use `$kspec-<nome>` ou linguagem natural para invocar skills.

2. **Ausência de `AskUserQuestion` em `codex exec`**: o modo não-interativo (`codex exec`) não suporta perguntas ao usuário. As seguintes skills só funcionam em modo interativo (`codex` sem argumentos):
   - `kspec-prd`
   - `kspec-techspec`
   - `kspec-tasks`
   - `kspec-implement`
   - `kspec-bugfix`
   - `kspec-bootstrap`

3. **Necessidade de MCP em `.codex/config.toml`**: MCPs como context7 e testsprite não são descobertos automaticamente. Devem ser declarados explicitamente em `.codex/config.toml` (projeto) ou `~/.codex/config.toml` (global). Veja a seção "MCP Opt-in" acima.

4. **Sandbox dos agents**: `kspec-task-runner` e `kspec-qa-runner` exigem `sandbox_mode = "workspace-write"`. Execute o Codex com permissões de escrita no workspace quando usar esses agents.

5. **Symlinks em Windows**: em sistemas Windows, `.codex/skills/` usa cópias em vez de symlinks. Após `kspec update`, resincronize manualmente se necessário.
