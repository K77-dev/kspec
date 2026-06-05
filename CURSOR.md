# CURSOR.md

Guia para agentes de IA ao trabalhar com o código deste repositório — plataforma Cursor.

Este projeto é o **kspec** — um kit de especificações e padrões para projetos desenvolvidos com agentes de IA. Contém skills, agents, rules e templates para Claude Code, OpenAI Codex CLI e Cursor. **Não contém código de aplicação executável.**

> Para Claude Code, consulte `CLAUDE.md`. Para OpenAI Codex CLI, consulte `AGENTS.md`.

## Visão Geral

O kspec padroniza o ciclo de vida de desenvolvimento com agentes de IA: da ideia à especificação, das tasks ao código revisado. O source of truth de todo o conteúdo (skills, agents, rules, templates) vive em `.agents/`. As plataformas Claude Code (`.claude/`), Codex CLI (`.codex/`) e Cursor (`.cursor/`) apontam para `.agents/` via symlinks e artefatos derivados.

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
├── .cursor/                     # Discovery para Cursor
│   ├── skills/                  # → .agents/skills/ (symlinks)
│   ├── agents/                  # → .agents/agents/ (symlinks)
│   ├── templates/               # → .agents/templates/ (symlink)
│   ├── validation/              # → .agents/validation/ (symlink)
│   └── rules/                   # *.mdc derivados de .agents/rules/*.md
├── .github/                     # GitHub Actions, instructions
├── spec/
│   └── tasks/                   # Artefatos gerados (PRDs, techspecs, tasks, reviews)
├── src/                         # Código-fonte principal
├── dist/                        # Build output
├── CURSOR.md                    # Este arquivo — guia para Cursor
├── AGENTS.md                    # Guia equivalente para Codex CLI
├── CLAUDE.md                    # Guia equivalente para Claude Code
├── README.md                    # Documentação pública do projeto
└── VERSION                      # Versão do kspec
```

## Skills Disponíveis

Para invocar uma skill no Cursor Agent, descreva a ação em linguagem natural ou mencione explicitamente o nome da skill (ex.: `kspec-prd`). Os arquivos de skill estão em `.agents/skills/<nome>/SKILL.md`.

| Skill | Invocação Cursor | Função |
| --- | --- | --- |
| `kspec-ideia` | "faça brainstorm de uma ideia" ou `kspec-ideia` | Brainstorm/discovery para decompor ideia em módulos |
| `kspec-prd` | "crie um PRD para..." ou `kspec-prd` | Cria PRD a partir de solicitação de funcionalidade |
| `kspec-techspec` | "crie a tech spec para..." ou `kspec-techspec` | Traduz PRD em especificação técnica |
| `kspec-tasks` | "quebre em tasks..." ou `kspec-tasks` | Quebra Tech Spec em tarefas incrementais |
| `kspec-implement` | "implemente as tasks de..." ou `kspec-implement` | Executa todas as tasks pendentes |
| `kspec-qa` | "execute QA de..." ou `kspec-qa` | Quality Assurance (E2E, acessibilidade) |
| `kspec-pr-review` | "revisão semântica da entrega antes do PR" ou `kspec-pr-review` | Alinhamento PRD/Tech Spec/tasks × diff, relatório e corpo do PR |
| `kspec-bugfix` | "corrija o bug documentado em..." ou `kspec-bugfix` | Corrige bugs documentados pelo QA |
| `kspec-bootstrap` | "configure o kspec neste projeto" ou `kspec-bootstrap` | Gera configuração para projeto existente |
| `kspec-version` | "qual a versão do kspec?" ou `kspec-version` | Exibe versão atual e lista skills/agents |

## Agents

Os agents são acionados automaticamente pelas skills. No Cursor, a delegação ocorre via **Task tool** com `subagent_type` correspondente. Definições canônicas em `.agents/agents/<nome>/AGENT.md`.

| Agent | Acionado por | `subagent_type` | Função |
| --- | --- | --- | --- |
| `kspec-task-runner` | `kspec-implement` | `kspec-task-runner` | Implementa uma task em contexto isolado |
| `kspec-review-runner` | `kspec-implement` | `kspec-review-runner` | Code review contra spec e rules |
| `kspec-qa-runner` | `kspec-qa` | `kspec-qa-runner` | Testa E2E, acessibilidade, visual |

## Rules — Padrões de Código

Edite sempre em `.agents/rules/` (source of truth). O Cursor lê as rules publicadas em `.cursor/rules/*.mdc` (artefatos derivados — regenere com `kspec update`).

| Rule | Caminho canônico | Publicação Cursor | Escopo |
| --- | --- | --- | --- |
| Padrões de código | `.agents/rules/code-standards.md` | `.cursor/rules/code-standards.mdc` | Nomenclatura, formatação, SOLID |
| Banco de dados | `.agents/rules/database.md` | `.cursor/rules/database.mdc` | ORM, queries, migrations |
| Logging | `.agents/rules/logging.md` | `.cursor/rules/logging.mdc` | Níveis e estrutura de log |
| Graphify | `.agents/rules/graphify.md` | `.cursor/rules/graphify.mdc` | Knowledge graph para análise |

## MCP Opt-in

O Cursor não descobre MCPs automaticamente. Para habilitar MCPs (context7, testsprite), crie ou edite `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "testsprite-mcp"]
    }
  }
}
```

Alternativamente, use `kspec-bootstrap` em modo interativo — a skill perguntará se deseja registrar os MCPs.

## Limitações conhecidas no Cursor

1. **Ausência de slash commands de projeto**: o Cursor não suporta slash commands de projeto (`/kspec-prd`). Use linguagem natural ou menção explícita (`kspec-prd`) para invocar skills.

2. **Delegação via Task tool**: `kspec-implement` e `kspec-qa` delegam agents via Task tool com `subagent_type` (`kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`). Se a Task tool estiver indisponível, as skills executam inline com aviso.

3. **Rules derivadas**: `.cursor/rules/*.mdc` são gerados a partir de `.agents/rules/*.md`. Edite o source of truth em `.agents/rules/` e rode `kspec update` — não edite `.mdc` manualmente.

4. **Symlinks em Windows**: em sistemas Windows, `.cursor/skills/` e `.cursor/agents/` usam cópias em vez de symlinks. Após `kspec update`, resincronize manualmente se necessário.

5. **MCP opt-in**: MCPs como context7 e testsprite não são descobertos automaticamente. Devem ser declarados explicitamente em `.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global). Veja a seção "MCP Opt-in" acima.

6. **Ferramenta interativa `AskQuestion`**: no Cursor, use `AskQuestion` para escolhas estruturadas (equivalente ao `AskUserQuestion` do Claude Code e ao `request_user_input` do Codex CLI). Skills como `kspec-prd`, `kspec-techspec`, `kspec-tasks`, `kspec-implement`, `kspec-bugfix` e `kspec-bootstrap` dependem de modo interativo.
