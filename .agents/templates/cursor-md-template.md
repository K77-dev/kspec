# CURSOR.md

Guia para agentes de IA ao trabalhar com o código deste repositório — plataforma Cursor.

[Breve descrição do projeto baseada no package.json]

> Para Claude Code, consulte `CLAUDE.md`. Para OpenAI Codex CLI, consulte `AGENTS.md`.

## Visão Geral

[Resumo do propósito do projeto e do ciclo de vida com agentes de IA. O source of truth de skills, agents, rules e templates vive em `.agents/`. A camada `.cursor/` aponta para `.agents/` via symlinks e rules derivadas em `.mdc`.]

## Estrutura do projeto

[Árvore de diretórios real do projeto com descrições — incluir `.cursor/`]

```
/
├── .agents/                     # Skills, agents, rules, templates (source of truth)
│   ├── skills/
│   ├── agents/
│   ├── rules/
│   └── templates/
├── .cursor/                     # Discovery para Cursor
│   ├── skills/                  # → .agents/skills/ (symlinks)
│   ├── agents/                  # → .agents/agents/ (symlinks)
│   ├── templates/               # → .agents/templates/ (symlink)
│   ├── validation/              # → .agents/validation/ (symlink)
│   └── rules/                   # *.mdc derivados de .agents/rules/*.md
├── [demais diretórios do projeto]
├── CURSOR.md                    # Este arquivo — guia para Cursor
├── CLAUDE.md                    # Guia equivalente para Claude Code
└── AGENTS.md                    # Guia equivalente para Codex CLI
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
| **Clean Code e SOLID** | `.agents/rules/code-standards.md` | `.cursor/rules/code-standards.mdc` (`alwaysApply: true`) | **Clean Code, SOLID, limites mensuráveis** — rule core obrigatória, sempre aplicável |
| [Nome legível] | `.agents/rules/[nome].md` | `.cursor/rules/[nome].mdc` | [Escopo detectado] |

**`code-standards.md` é inegociável** — não remova em projetos brownfield. O artefato `.cursor/rules/code-standards.mdc` mantém `alwaysApply: true` após `kspec update`. Apenas convenções de estilo em rules enterprise são adaptáveis no bootstrap; princípios universais de Clean Code e SOLID permanecem intactos.

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

2. **Delegação via Task tool**: `kspec-implement` e `kspec-qa` delegam agents via Task tool com `subagent_type`. Se a Task tool estiver indisponível, as skills executam inline com aviso.

3. **Rules derivadas**: `.cursor/rules/*.mdc` são gerados a partir de `.agents/rules/*.md`. Edite o source of truth em `.agents/rules/` e rode `kspec update` — não edite `.mdc` manualmente.

4. **Symlinks em Windows**: em sistemas Windows, `.cursor/skills/` e `.cursor/agents/` usam cópias em vez de symlinks. Após `kspec update`, resincronize manualmente se necessário.

5. **MCP opt-in**: MCPs como context7 e testsprite não são descobertos automaticamente. Devem ser declarados explicitamente em `.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global). Veja a seção "MCP Opt-in" acima.

6. **Ferramenta interativa `AskQuestion`**: no Cursor, use `AskQuestion` para escolhas estruturadas (equivalente ao `AskUserQuestion` do Claude Code e ao `request_user_input` do Codex CLI). Skills como `kspec-prd`, `kspec-techspec`, `kspec-tasks`, `kspec-bootstrap` dependem de modo interativo.
