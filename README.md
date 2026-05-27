# kspec

[![npm version](https://img.shields.io/npm/v/@k77-dev/kspec.svg)](https://www.npmjs.com/package/@k77-dev/kspec)
[![npm downloads](https://img.shields.io/npm/dm/@k77-dev/kspec.svg)](https://www.npmjs.com/package/@k77-dev/kspec)
[![license](https://img.shields.io/npm/l/@k77-dev/kspec.svg)](LICENSE)

Kit de especificações e padrões para projetos desenvolvidos com agentes de IA — para **Claude Code** e **OpenAI Codex CLI**.

```bash
npm install -g @k77-dev/kspec
kspec init
```

## Por que este projeto existe

Agentes de IA produzem codigo melhor quando recebem contexto estruturado. Sem regras claras, cada conversa comeca do zero — o agente nao sabe qual framework usar, como nomear arquivos, onde salvar artefatos ou qual fluxo seguir.

Este repositorio resolve isso fornecendo:

- **Padroes de codigo** — regras consistentes para nomenclatura, formatacao e boas praticas
- **Fluxo de desenvolvimento estruturado** — do requisito ao PR, cada etapa tem uma skill ou agent dedicado
- **Verificacao semantica (AI Spec Intelligence)** — `/kspec-pr-review` valida aderencia spec × codigo antes do Pull Request
- **Templates padronizados** — PRD, Tech Spec e Tasks seguem formatos previsiveis que se referenciam entre si
- **Skills empresariais opcionais** — repositorio de skills/rules/templates corporativos sincronizado via lock file

## Exemplo de uso rapido

```
Dev: /kspec-prd
     "Quero um sistema de autenticacao com login social"
     → responde perguntas do agente
     → PRD gerado em spec/tasks/001-prd-auth/prd.md

Dev: /kspec-techspec 001-prd-auth
     → agente le o PRD, faz perguntas tecnicas
     → Tech Spec gerada em spec/tasks/001-prd-auth/techspec.md

Dev: /kspec-tasks 001-prd-auth
     → agente quebra em 8 tasks, dev aprova
     → Tasks geradas em spec/tasks/001-prd-auth/

Dev: /kspec-implement 001-prd-auth
     → agente implementa cada task + review automatica
     → codigo implementado + reviews geradas

Dev: /kspec-qa 001-prd-auth
     → agente testa E2E + acessibilidade
     → aprovado ou bugs documentados

Dev: /kspec-pr-review 001-prd-auth  (antes de abrir o PR)
     → relatorio pr-review.md (Alignment Score + APPROVED/REJECTED)
     → corpo do PR preenchido pelo template oficial

Dev: /kspec-bugfix 001-prd-auth  (se necessario)
     → agente corrige bugs + testes de regressao
```

## Visao geral do fluxo

```
                          ┌─────────────────────────────────────────────┐
                          │              SETUP (uma vez)                │
                          │                                             │
                          │  1. Instala kspec no projeto                │
                          │  2. /kspec-bootstrap                        │
                          │     → detecta stack, adapta rules ao projeto│
                          │     → gera CLAUDE.bootstrap.md / AGENTS.bootstrap.md │
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
              │   /kspec-implement               (uma ou todas as tasks)        │
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
              │   APROVADO ──▶ /kspec-pr-review (AI Spec Intelligence)          │
              │   REPROVADO ──▶ /kspec-bugfix ──▶ roda /kspec-qa novamente     │
              └────────────────────────────────┬───────────────────────────────┘
                                               │
              ┌────────────────────────────────▼───────────────────────────────┐
              │                     REVISAO SEMANTICA (PR)                     │
              │                                                                │
              │   /kspec-pr-review                                              │
              │   → pr-review.md (Alignment Score, gaps, riscos)               │
              │   → corpo do PR (.agents/templates/pr-template.md)             │
              │   → APPROVED / APPROVED WITH WARNINGS / REJECTED               │
              │                                                                │
              │   APROVADO ──▶ abrir Pull Request                              │
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
   │  /kspec-implement     │                         │
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

## Matriz de plataformas

| Plataforma | Caminho canônico (source of truth) | Discovery | Guia principal | Invocação de skills |
|---|---|---|---|---|
| Claude Code | `.agents/` | `.claude/` (symlinks) | `CLAUDE.md` | `/kspec-<nome>` |
| OpenAI Codex CLI | `.agents/` | `.codex/` (symlinks + `.toml`) | `AGENTS.md` | `$kspec-<nome>` |

Skills, agents, rules e templates vivem em `.agents/` e são descobertos via symlinks em `.claude/` (Claude Code) e `.codex/` (Codex CLI). Não edite `.claude/` nem `.codex/` diretamente — as alterações vão para `.agents/` primeiro.

## Limitações conhecidas

| Limitação | Impacto |
|---|---|
| `codex exec` não é interativo | `AskUserQuestion` / `request_user_input` não funcionam em modo batch — skills fazem fallback para perguntas em texto numerado; confirmações de readline ainda exigem sessão interativa (`codex`) |
| Sem slash commands no Codex CLI | Skills devem ser invocadas por linguagem natural ou `$kspec-<nome>`, não por `/kspec-<nome>` |
| Windows | Symlinks exigem modo desenvolvedor ou privilégios de administrador — o `kspec init` usa cópia (`fs-extra.copy`) como fallback automático |
| MCP opt-in | Os MCP servers (context7, testsprite) precisam ser registrados manualmente em `.codex/config.toml` — o `/kspec-bootstrap` oferece opt-in durante o setup |
| Sandbox do Codex | `kspec-review-runner` usa `sandbox_mode = "read-only"`; `kspec-task-runner` e `kspec-qa-runner` usam `workspace-write` — verifique os `.toml` em `.codex/agents/` se precisar ajustar |

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
.agents/                        # Source of truth — skills, agents, rules, templates
├── skills/                     # 10 skills kspec + skills empresariais (ex.: cybersecurity-analyst)
├── agents/                     # 3 agents (tarefas isoladas)
├── rules/                      # Rules core + rules de stack (enterprise)
├── templates/                  # Templates (PRD, techspec, tasks, pr, etc.)
└── validation/                 # Validacao de skills empresariais (enterprise-skills-check.md)
.claude/                        # Discovery para Claude Code (symlinks → .agents/)
.codex/                         # Discovery para Codex CLI (symlinks + agents/*.toml)
spec/
└── tasks/                      # Artefatos gerados (PRDs, techspecs, tasks, reviews)
CLAUDE.md                       # Guia principal para Claude Code
AGENTS.md                       # Guia principal para OpenAI Codex CLI
enterprise-skills-lock.json     # Lock de skills empresariais (versionamento)
```

## Skills, Agents e Rules

### Conceitos

| Tipo | Contexto | Quando usar |
|---|---|---|
| **Skills** | Principal — descricao carrega no inicio, conteudo ao invocar | Workflows que precisam de interacao com o usuario |
| **Agents** | Isolado — contexto separado, so o resultado volta | Tarefas autocontidas que produzem relatorios |
| **Rules** | Carregam automaticamente (com ou sem path filter) | Padroes de codigo por dominio |

### Skills — entradas e saidas (10 core + empresariais)

Cada skill le documentos especificos e produz artefatos rastreaveis. Todos os caminhos sao relativos a `spec/tasks/[NNN]-prd-[nome]/`.

#### Setup

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-bootstrap` | `package.json`, lockfiles, configs do projeto, `CLAUDE.md`/`AGENTS.md` (se existirem), codigo-fonte (brownfield) | `CLAUDE.bootstrap.md` e/ou `AGENTS.bootstrap.md`, rules em `.agents/rules/` (selecionadas e **adaptadas ao padrao do projeto-alvo**), `spec/tasks/`, `.codex/config.toml` (MCP opt-in), CI/CD opcional |

#### Especificacao

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-ideia` | Respostas do dev (visao, modulos, requisitos por modulo) | `spec/prompts/[NNN]-[nome].md` (um por modulo) + `spec/prompts/README.md` |
| `/kspec-prd` | Solicitacao do dev + respostas de clarificacao, template `prd-template.md` | `prd.md` |
| `/kspec-techspec` | `prd.md`, codigo-fonte do projeto, rules, template `techspec-template.md` | `techspec.md` |
| `/kspec-tasks` | `prd.md`, `techspec.md`, templates `tasks-template.md` + `task-template.md` | `tasks.md` + `[num]_task.md` (um arquivo por task) |

#### Implementacao

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-implement` | `tasks.md`, `[num]_task.md`, `prd.md`, `techspec.md`, rules | Codigo implementado + `review_[num].md` (uma ou todas as tasks) |

**Detalhamento do ciclo interno de cada task:**

```
/kspec-implement le:                       /kspec-implement produz:
├── tasks.md (identifica proxima)          ├── codigo-fonte (via task-runner)
├── [num]_task.md (definicao)              ├── testes unitarios (via task-runner)
├── prd.md (contexto)                      ├── review_[num].md (via review-runner)
├── techspec.md (arquitetura)              └── tasks.md atualizado (marca completa)
└── rules (padroes)
```

O review-runner (agent) le adicionalmente:
- `git diff` (mudancas de codigo)
- Resultado dos checks (`lint`, `typecheck`, `build`, `test`)

#### Qualidade

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-qa` | `prd.md`, `techspec.md`, `tasks.md`, aplicacao rodando em localhost, rules | `qa.md` + `bugs.md` |
| `/kspec-pr-review` | `prd.md`, `techspec.md`, `*_task.md`, `tasks.md`, `git diff` (working tree e branch base) | `pr-review.md` (Alignment Score auditavel, gaps, riscos, recomendacao) + corpo do PR (`.agents/templates/pr-template.md`) |
| `/kspec-bugfix` | `bugs.md`, `prd.md`, `techspec.md`, `tasks.md`, rules | Correcoes no codigo + testes de regressao + `bugfix.md` + `bugs.md` atualizado |

O qa-runner (agent) le adicionalmente:
- Resultado dos testes E2E (TestSprite MCP)
- Verificacoes de acessibilidade (WCAG 2.2)
- Auditoria de vulnerabilidades (`bun audit` / `npm audit`)
- Metricas de performance (bundle size, Lighthouse)

#### Utilitario

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-version` | `VERSION`, `.agents/skills/`, `.agents/agents/` | Exibe versao do kspec e lista skills/agents instalados |

#### Skills empresariais (opcionais)

Instaladas via validacao em `@.agents/validation/enterprise-skills-check.md` durante o bootstrap. Versionadas em `enterprise-skills-lock.json`.

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `cybersecurity-analyst` | Eventos, arquitetura ou codigo sob analise de seguranca | Analise STRIDE/MITRE ATT&CK, vetores de ataque, controles e riscos residuais |

### Agents — entradas e saidas (3)

Os agents rodam em contexto isolado e sao acionados pelas skills — nao precisam ser invocados diretamente.

| Agent | Acionado por | Le (entrada) | Produz (saida) |
|---|---|---|---|
| `kspec-task-runner` | /kspec-implement | `[num]_task.md`, `prd.md`, `techspec.md`, rules, codigo existente | Codigo-fonte + testes unitarios |
| `kspec-review-runner` | /kspec-implement | `git diff`, `techspec.md`, `tasks.md`, rules, resultado dos checks | `review_[num].md` (APROVADO / RESSALVAS / REPROVADO) |
| `kspec-qa-runner` | kspec-qa | `prd.md`, `techspec.md`, `tasks.md`, rules, app rodando | `qa.md` + `bugs.md` |

### Rules

#### Core kspec (sempre presentes)

| Rule | Escopo |
|---|---|
| `code-standards.md` | Padroes gerais de codigo (nomenclatura, formatacao, SOLID) |
| `database.md` | Padroes de banco de dados |
| `logging.md` | Padroes de logging |
| `graphify.md` | Uso do knowledge graph (Graphify) nas skills de analise |

#### Stack enterprise (selecionadas no bootstrap)

| Rule | Escopo |
|---|---|
| `typescript.md` | TypeScript, package manager, exports |
| `java.md` | Convencoes Java (DTOs, estilo, streams) |
| `react.md` | React, UI, testes frontend |
| `angular.md` | Angular, modulos, testes |
| `hono.md` | Backend Hono, rotas, middleware |
| `spring-boot.md` | Spring Boot, Maven/Gradle, persistencia |
| `tests.md` | Test runner e convencoes de teste (JS/TS) |
| `java-tests.md` | Testes Java (JUnit, AssertJ, fixtures) |

> Em projetos existentes (brownfield), o `/kspec-bootstrap` **adapta o conteudo** das rules enterprise ao padrao real do projeto-alvo (ex.: POJO vs `record`, Gradle vs Maven, Jest vs Vitest) — o codigo do projeto prevalece sobre os defaults das rules.

## Artefatos gerados por funcionalidade

Cada funcionalidade gera um diretorio em `spec/tasks/` com todos os artefatos do ciclo:

```
spec/tasks/[NNN]-prd-[nome]/
├── prd.md            ← /kspec-prd             Le: solicitacao do dev
├── techspec.md       ← /kspec-techspec        Le: prd.md + codigo do projeto
├── tasks.md          ← /kspec-tasks           Le: prd.md + techspec.md
├── [num]_task.md     ← /kspec-tasks           Le: prd.md + techspec.md
├── review_[num].md   ← agent review-runner    Le: git diff + techspec.md + tasks.md + rules
├── qa.md             ← agent qa-runner        Le: prd.md + techspec.md + tasks.md + app rodando
├── bugs.md           ← agent qa-runner        Le: (gerado junto com qa.md)
├── pr-review.md        ← /kspec-pr-review        Le: prd.md + techspec.md + tasks + git diff + template pr
└── bugfix.md         ← /kspec-bugfix          Le: bugs.md + prd.md + techspec.md
```

Rastreabilidade completa: cada artefato referencia o anterior, permitindo navegar do requisito ate o codigo implementado.

## Como usar

### Instalacao

#### CLI via npm

Instale o CLI globalmente:

```bash
npm install -g @k77-dev/kspec
```

Na raiz do seu projeto, rode:

```bash
kspec init
```

Isso instala o kspec completo no projeto:

- `.agents/` — source of truth (skills, agents, rules, templates, validation)
- `.claude/` — symlinks para discovery no Claude Code
- `.codex/` — symlinks de skills + `agents/*.toml` gerados para Codex CLI
- `CLAUDE.md` e `AGENTS.md` — criados na raiz se ainda nao existirem

**Comandos disponiveis:**

| Comando | Descricao |
|---|---|
| `kspec init` | Instala `.agents/`, symlinks em `.claude/` e `.codex/`, e docs na raiz |
| `kspec init --force` | Sobrescreve sem perguntar caso `.claude/` ja exista |
| `kspec update` | Atualiza os arquivos kspec no projeto para a versao do CLI instalado |
| `kspec --version` | Exibe a versao instalada do kspec |
| `kspec --help` | Lista comandos e opcoes disponiveis |

> Funciona com qualquer gerenciador de pacotes Node: `npm`, `pnpm`, `yarn` ou `bun`.
> Tambem e possivel rodar sem instalacao global via `npx @k77-dev/kspec init`.

### Configuracao

1. Abra o projeto no seu agente de IA (Claude Code ou Codex CLI)
2. Execute `/kspec-bootstrap` (ou `$kspec-bootstrap`) — valida skills empresariais, detecta stack, adapta rules e gera `CLAUDE.bootstrap.md` e/ou `AGENTS.bootstrap.md`
3. Revise os arquivos gerados e incorpore ao guia principal (`CLAUDE.md` / `AGENTS.md`)
4. Fluxo por funcionalidade: `/kspec-prd` → `/kspec-techspec` → `/kspec-tasks` → `/kspec-implement` → `/kspec-qa` → `/kspec-pr-review`

### Atualizacao

#### Atualizar o kspec em um projeto existente

Se você ja tem o kspec instalado no projeto e quer atualizar para a versao mais recente:

**Passo 1 — Atualizar o CLI globalmente:**

```bash
npm cache clean --force
npm install -g @k77-dev/kspec@latest
```

> Se o npm nao reconhecer a versao nova apos `npm update -g`, use o comando acima para limpar o cache e forcar a instalacao da versao mais recente.

**Passo 2 — Atualizar os arquivos no projeto:**

```bash
kspec update
```

O comando `kspec update` re-sincroniza `.agents/`, symlinks em `.claude/` e `.codex/` (incluindo regeneracao dos `.toml`) sem pedir confirmacao, preservando qualquer outro conteudo do projeto.

> Arquivos customizados **dentro** das pastas `skills/`, `agents/`, `rules/` ou `templates/` serao sobrescritos — mova customizacoes para fora dessas pastas antes de atualizar.

#### Alternativa sem instalacao global

```bash
npx @k77-dev/kspec@latest update
```

## Principios de design

- **Linguagem direta** — instrucoes claras com justificativa, sem enfase agressiva
- **Sem repeticao** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → PR Review → Bugfix
- **Codigo em ingles, specs em portugues** — publicos e propositos diferentes
- **Contexto otimizado** — skills para interacao, agents para trabalho isolado
