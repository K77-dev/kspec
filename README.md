# kspec

Kit de especificações e padrões para projetos desenvolvidos com agentes de IA — compativel com **Claude Code**, **Gemini CLI**, **GitHub Copilot** e **Agents (generico)**.

## Por que este projeto existe

Agentes de IA produzem codigo melhor quando recebem contexto estruturado. Sem regras claras, cada conversa comeca do zero — o agente nao sabe qual framework usar, como nomear arquivos, onde salvar artefatos ou qual fluxo seguir.

Este repositorio resolve isso fornecendo:

- **Padroes de codigo** — regras consistentes para nomenclatura, formatacao e boas praticas
- **Fluxo de desenvolvimento estruturado** — do requisito ao bugfix, cada etapa tem uma skill ou agent dedicado
- **Templates padronizados** — PRD, Tech Spec e Tasks seguem formatos previsiveis que se referenciam entre si
- **Multi-agente** — mesmas skills, agents, rules e templates adaptados para Claude Code, Gemini CLI e GitHub Copilot

## Visao geral do fluxo

```
                          ┌─────────────────────────────────────────────┐
                          │              SETUP (uma vez)                │
                          │                                             │
                          │  1. Instala kspec no projeto                │
                          │  2. /kspec-bootstrap                        │
                          │     → detecta stack, gera CLAUDE.md + rules │
                          │  3. Dev revisa e ajusta                     │
                          └────────────────────┬────────────────────────┘
                                               │
                          ┌────────────────────▼────────────────────────┐
                          │         POR FUNCIONALIDADE (ciclo)          │
                          └────────────────────┬────────────────────────┘
                                               │
              ┌────────────────────────────────▼────────────────────────────────┐
              │                        ESPECIFICACAO                            │
              │                                                                │
              │   /kspec-prd ──▶ /kspec-techspec ──▶ /kspec-tasks              │
              │    (requisitos)    (arquitetura)       (tarefas)                │
              │                                                                │
              │   O dev interage com o agente em cada etapa:                    │
              │   responde perguntas, valida decisoes, aprova a lista de tasks │
              └────────────────────────────────┬───────────────────────────────┘
                                               │
              ┌────────────────────────────────▼───────────────────────────────┐
              │                       IMPLEMENTACAO                            │
              │                                                                │
              │   /kspec-implement-task          (uma task por vez)             │
              │   /kspec-implement-all-tasks     (todas de uma vez)            │
              │                                                                │
              │   Para cada task:                                               │
              │   ┌──────────────────────────────────────────────────────┐      │
              │   │  skill orquestra ──▶ agent task-runner (implementa) │      │
              │   │                  ──▶ agent review-runner (revisa)   │      │
              │   │                                                      │      │
              │   │  aprovado ──▶ marca completa                        │      │
              │   │  ressalvas ──▶ corrige (1 chance) ──▶ marca         │      │
              │   │  reprovado ──▶ reimplementa (ate 2x) ──▶ para      │      │
              │   └──────────────────────────────────────────────────────┘      │
              └────────────────────────────────┬───────────────────────────────┘
                                               │
              ┌────────────────────────────────▼───────────────────────────────┐
              │                     QUALITY ASSURANCE                           │
              │                                                                │
              │   /kspec-qa                                                     │
              │   ┌──────────────────────────────────────────────────────┐      │
              │   │  agent qa-runner (contexto isolado)                  │      │
              │   │  → testa fluxos E2E (TestSprite)                    │      │
              │   │  → verifica acessibilidade (WCAG 2.2)               │      │
              │   │  → gera qa.md + bugs.md                             │      │
              │   └──────────────────────────────────────────────────────┘      │
              │                                                                │
              │   APROVADO ──▶ funcionalidade pronta                            │
              │   REPROVADO ──▶ /kspec-bugfix ──▶ roda /kspec-qa novamente     │
              └────────────────────────────────────────────────────────────────┘
```

### Quem faz o que

| Ator | O que faz |
|---|---|
| **Dev** | Invoca skills (`/kspec-prd`, `/kspec-tasks`, etc.), responde perguntas, aprova decisoes, revisa artefatos |
| **Skill** | Orquestra o fluxo — faz perguntas ao dev, chama templates, delega a agents, gera artefatos |
| **Agent** | Executa trabalho pesado em contexto isolado (implementar, revisar, testar) e retorna resultado |
| **Rule** | Carrega automaticamente e guia o agente sobre padroes de codigo sem interacao |

### Interacao skill vs agent

```
  Dev                    Skill                     Agent
   │                       │                         │
   │  /kspec-implement-task│                         │
   │──────────────────────▶│                         │
   │                       │                         │
   │                       │  delega implementacao   │
   │                       │────────────────────────▶│ task-runner
   │                       │                         │ (contexto isolado)
   │                       │    resultado + codigo   │
   │                       │◀────────────────────────│
   │                       │                         │
   │                       │  delega review          │
   │                       │────────────────────────▶│ review-runner
   │                       │                         │ (contexto isolado)
   │                       │    aprovado/reprovado   │
   │                       │◀────────────────────────│
   │                       │                         │
   │   resumo final        │                         │
   │◀──────────────────────│                         │
```

Skills rodam **no contexto principal** (veem o historico da conversa, podem fazer perguntas).
Agents rodam em **contexto isolado** (nao veem a conversa, recebem apenas os inputs necessarios).

## Agentes suportados

| Agente | Diretorio de config | Guia principal | Skills | Agents | Rules | Templates |
|---|---|---|---|---|---|---|
| Claude Code | `.claude/` | `CLAUDE.md` | `.claude/skills/` | `.claude/agents/` | `.claude/rules/` | `.claude/templates/` |
| Gemini CLI | `.gemini/` | `GEMINI.md` | `.gemini/skills/` | `.gemini/agents/` | `.gemini/rules/` | `.gemini/templates/` |
| GitHub Copilot | `.github/` | `.github/copilot-instructions.md` | `.github/prompts/` | `.github/prompts/` | `.github/instructions/` | `.github/templates/` |
| Agents (generico) | `.agents/` | `AGENTS.md` | `.agents/skills/` | `.agents/agents/` | `.agents/rules/` | `.agents/templates/` |

> `.agents/` e o **source of truth**. Os outros diretorios sao sincronizados via `/kspec-sync`.

## Stack padrao (para projetos que usam kspec)

As rules e templates do kspec sao otimizados para esta stack, mas podem ser adaptados via `/kspec-bootstrap`:

| Area | Tecnologia |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v4, shadcn/ui (base-nova) |
| Backend | Hono, Bun runtime |
| Testes | Vitest (unit), TestSprite (E2E) |
| Package Manager | bun |

## Estrutura do repositorio

```
.agents/                        # Configuracao generica (SOURCE OF TRUTH)
├── skills/                     # 13 skills invocaveis
├── agents/                     # 3 agents (tarefas isoladas)
├── rules/                      # 3 rules (padroes de codigo)
├── templates/                  # 6 templates (PRD, techspec, tasks, etc.)
└── validation/                 # Validacoes de skills empresariais
.claude/                        # Configuracao Claude Code (sync de .agents/)
.gemini/                        # Configuracao Gemini CLI (sync de .agents/)
.github/                        # Configuracao GitHub Copilot (sync de .agents/)
spec/
└── tasks/                      # Artefatos gerados (PRDs, techspecs, tasks, reviews)
CLAUDE.md                       # Guia principal para Claude Code
GEMINI.md                       # Guia principal para Gemini CLI
AGENTS.md                       # Guia principal para Agents (generico)
enterprise-skills-lock.json     # Lock de skills empresariais (versionamento)
```

## Skills, Agents e Rules

### Conceitos

| Tipo | Contexto | Quando usar |
|---|---|---|
| **Skills** | Principal — descricao carrega no inicio, conteudo ao invocar | Workflows que precisam de interacao com o usuario |
| **Agents** | Isolado — contexto separado, so o resultado volta | Tarefas autocontidas que produzem relatorios |
| **Rules** | Carregam automaticamente (com ou sem path filter) | Padroes de codigo por dominio |

### Skills disponiveis (13)

| Skill | Fase | Funcao |
|---|---|---|
| `/kspec-bootstrap` | Setup | Detecta stack e gera configuracao para o projeto |
| `/kspec-prd` | Especificacao | Cria PRD a partir de solicitacao de funcionalidade |
| `/kspec-techspec` | Especificacao | Traduz PRD em especificacao tecnica |
| `/kspec-tasks` | Especificacao | Quebra Tech Spec em tarefas incrementais |
| `/kspec-implement-task` | Implementacao | Implementa proxima tarefa disponivel (uma por vez) |
| `/kspec-implement-all-tasks` | Implementacao | Executa todas as tasks pendentes |
| `/kspec-qa` | Qualidade | Quality Assurance (E2E, acessibilidade) |
| `/kspec-bugfix` | Qualidade | Corrige bugs documentados pelo QA |
| `/kspec-apidoc` | Documentacao | Gera documentacao OpenAPI 3.1 |
| `/kspec-adr` | Documentacao | Gera Architecture Decision Records |
| `/kspec-release` | Documentacao | Gera changelog e notas de release |
| `/kspec-migrate` | Manutencao | Planeja e executa upgrades de dependencias |
| `/kspec-sync` | Manutencao | Sincroniza plataformas a partir do `.agents/` |

### Agents (3)

Os agents rodam em contexto isolado e sao acionados pelas skills — nao precisam ser invocados diretamente.

| Agent | Acionado por | Funcao |
|---|---|---|
| `kspec-task-runner` | `/kspec-implement-task`, `/kspec-implement-all-tasks` | Implementa uma task individual em contexto isolado |
| `kspec-review-runner` | `/kspec-implement-task`, `/kspec-implement-all-tasks` | Code review contra TechSpec, Tasks e rules |
| `kspec-qa-runner` | `/kspec-qa` | Testa E2E, acessibilidade, visual |

### Rules (3)

| Rule | Escopo |
|---|---|
| `code-standards.md` | Padroes gerais de codigo (nomenclatura, formatacao, boas praticas) |
| `database.md` | Padroes de banco de dados |
| `logging.md` | Padroes de logging |

> Rules adicionais especificas de stack (React, TypeScript, HTTP, testes) podem ser adicionadas via repositorio enterprise ou localmente.

## Artefatos gerados por funcionalidade

Cada funcionalidade gera um diretorio em `spec/tasks/` com todos os artefatos do ciclo:

```
spec/tasks/[NNN]-prd-[nome]/
├── prd.md          ← /kspec-prd           Requisitos de produto
├── techspec.md     ← /kspec-techspec      Especificacao arquitetural
├── tasks.md        ← /kspec-tasks         Lista de tarefas (indice)
├── [num]_task.md   ← /kspec-tasks         Definicao individual de cada task
├── review_[num].md ← agent review-runner  Code review (um por task)
├── qa.md           ← agent qa-runner      Resultado do QA
├── bugs.md         ← agent qa-runner      Bugs encontrados
└── bugfix.md       ← /kspec-bugfix        Correcoes aplicadas
```

Rastreabilidade completa: cada artefato referencia o anterior, permitindo navegar do requisito ate o codigo implementado.

## Como usar

### Instalacao

Na raiz do seu projeto, copie o diretorio do agente que voce utiliza:

**Claude Code:**

```bash
bunx degit K77-dev/kspec/.claude .claude --force
```

**Gemini CLI:**

```bash
bunx degit K77-dev/kspec/.gemini .gemini --force
```

**GitHub Copilot:**

```bash
bunx degit K77-dev/kspec/.github .github --force
```

**Agents (generico):**

```bash
bunx degit K77-dev/kspec/.agents .agents --force
```

**Todos os agentes de uma vez:**

```bash
git clone --depth 1 git@github.com:K77-dev/kspec.git /tmp/kspec && cp -r /tmp/kspec/.claude /tmp/kspec/.gemini /tmp/kspec/.github /tmp/kspec/.agents . && rm -rf /tmp/kspec
```

> Substitua `bunx` por `npx` ou `pnpm dlx` se preferir.

### Configuracao

1. Execute `/kspec-bootstrap` no seu agente de IA
2. Revise o arquivo de guia gerado (ex: `CLAUDE.bootstrap.md`) e renomeie para o guia principal (ex: `CLAUDE.md`)
3. Use o fluxo de desenvolvimento descrito acima

### Exemplo de uso rapido

```
Dev: /kspec-prd
     "Quero um sistema de autenticacao com login social"
     → responde perguntas do agente
     → PRD gerado em spec/tasks/001-prd-auth/prd.md

Dev: /kspec-techspec
     → agente le o PRD, faz perguntas tecnicas
     → Tech Spec gerada em spec/tasks/001-prd-auth/techspec.md

Dev: /kspec-tasks
     → agente quebra em 8 tasks, dev aprova
     → Tasks geradas em spec/tasks/001-prd-auth/

Dev: /kspec-implement-all-tasks
     → agente implementa cada task + review automatica
     → codigo implementado + reviews geradas

Dev: /kspec-qa
     → agente testa E2E + acessibilidade
     → aprovado ou bugs documentados

Dev: /kspec-bugfix  (se necessario)
     → agente corrige bugs + testes de regressao
```

## Principios de design

- **Linguagem direta** — instrucoes claras com justificativa, sem enfase agressiva
- **Sem repeticao** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → Bugfix
- **Codigo em ingles, specs em portugues** — publicos e propositos diferentes
- **Contexto otimizado** — skills para interacao, agents para trabalho isolado
- **Source of truth unico** — `.agents/` como fonte, demais plataformas sincronizadas
