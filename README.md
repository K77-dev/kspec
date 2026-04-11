# kspec

Kit de especificações e padrões para projetos desenvolvidos com agentes de IA — compativel com **Claude Code**, **GitHub Copilot** e **Agents (generico)**.

## Por que este projeto existe

Agentes de IA produzem codigo melhor quando recebem contexto estruturado. Sem regras claras, cada conversa comeca do zero — o agente nao sabe qual framework usar, como nomear arquivos, onde salvar artefatos ou qual fluxo seguir.

Este repositorio resolve isso fornecendo:

- **Padroes de codigo** — regras consistentes para nomenclatura, formatacao e boas praticas
- **Fluxo de desenvolvimento estruturado** — do requisito ao bugfix, cada etapa tem uma skill ou agent dedicado
- **Templates padronizados** — PRD, Tech Spec e Tasks seguem formatos previsiveis que se referenciam entre si
- **Multi-agente** — mesmas skills, agents, rules e templates adaptados para Claude Code e GitHub Copilot

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

Dev: /kspec-implement-all-tasks 001-prd-auth
     → agente implementa cada task + review automatica
     → codigo implementado + reviews geradas

Dev: /kspec-qa 001-prd-auth
     → agente testa E2E + acessibilidade
     → aprovado ou bugs documentados

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
├── skills/                     # 14 skills invocaveis
├── agents/                     # 3 agents (tarefas isoladas)
├── rules/                      # 3 rules (padroes de codigo)
├── templates/                  # 6 templates (PRD, techspec, tasks, etc.)
└── validation/                 # Validacoes de skills empresariais
.claude/                        # Configuracao Claude Code (sync de .agents/)
.github/                        # Configuracao GitHub Copilot (sync de .agents/)
spec/
└── tasks/                      # Artefatos gerados (PRDs, techspecs, tasks, reviews)
CLAUDE.md                       # Guia principal para Claude Code
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

### Skills — entradas e saidas (14)

Cada skill le documentos especificos e produz artefatos rastreaveis. Todos os caminhos sao relativos a `spec/tasks/[NNN]-prd-[nome]/`.

#### Setup

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-bootstrap` | `package.json`, lockfiles, configs do projeto, `CLAUDE.md` (se existir) | `CLAUDE.bootstrap.md`, rules adaptadas em `.claude/rules/`, `spec/tasks/` (diretorio), CI/CD opcional |

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
| `/kspec-implement-task` | `tasks.md`, `[num]_task.md`, `prd.md`, `techspec.md`, rules | Codigo implementado + `review_[num].md` |
| `/kspec-implement-all-tasks` | Mesmos do implement-task (para cada task pendente) | Codigo implementado + `review_[num].md` (um por task) |

**Detalhamento do ciclo interno de cada task:**

```
implement-task le:                         implement-task produz:
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
| `/kspec-bugfix` | `bugs.md`, `prd.md`, `techspec.md`, `tasks.md`, rules | Correcoes no codigo + testes de regressao + `bugfix.md` + `bugs.md` atualizado |

O qa-runner (agent) le adicionalmente:
- Resultado dos testes E2E (TestSprite MCP)
- Verificacoes de acessibilidade (WCAG 2.2)
- Auditoria de vulnerabilidades (`bun audit` / `npm audit`)
- Metricas de performance (bundle size, Lighthouse)

#### Documentacao

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-apidoc` | `techspec.md`, controllers/routes do projeto, schemas de validacao | `spec/api/openapi.yaml` |
| `/kspec-adr` | Respostas do dev (contexto, opcoes, decisao), template `adr-template.md` | `spec/adrs/[NNN]-titulo.md` + `spec/adrs/index.md` |
| `/kspec-release` | `git log` (commits desde ultima tag), `spec/tasks/*/tasks.md` + `prd.md` (PRDs completos) | `CHANGELOG.md` + tag git (opcional) |

#### Manutencao

| Skill | Le (entrada) | Produz (saida) |
|---|---|---|
| `/kspec-migrate` | `package.json`, lockfiles, codigo-fonte, migration guide (Context7/docs) | Codigo migrado + dependencias atualizadas |
| `/kspec-sync` | `.agents/` (source of truth) | `.claude/`, `.github/` sincronizados |

### Agents — entradas e saidas (3)

Os agents rodam em contexto isolado e sao acionados pelas skills — nao precisam ser invocados diretamente.

| Agent | Acionado por | Le (entrada) | Produz (saida) |
|---|---|---|---|
| `kspec-task-runner` | implement-task, implement-all-tasks | `[num]_task.md`, `prd.md`, `techspec.md`, rules, codigo existente | Codigo-fonte + testes unitarios |
| `kspec-review-runner` | implement-task, implement-all-tasks | `git diff`, `techspec.md`, `tasks.md`, rules, resultado dos checks | `review_[num].md` (APROVADO / RESSALVAS / REPROVADO) |
| `kspec-qa-runner` | kspec-qa | `prd.md`, `techspec.md`, `tasks.md`, rules, app rodando | `qa.md` + `bugs.md` |

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
├── prd.md            ← /kspec-prd             Le: solicitacao do dev
├── techspec.md       ← /kspec-techspec        Le: prd.md + codigo do projeto
├── tasks.md          ← /kspec-tasks           Le: prd.md + techspec.md
├── [num]_task.md     ← /kspec-tasks           Le: prd.md + techspec.md
├── review_[num].md   ← agent review-runner    Le: git diff + techspec.md + tasks.md + rules
├── qa.md             ← agent qa-runner        Le: prd.md + techspec.md + tasks.md + app rodando
├── bugs.md           ← agent qa-runner        Le: (gerado junto com qa.md)
└── bugfix.md         ← /kspec-bugfix          Le: bugs.md + prd.md + techspec.md
```

Rastreabilidade completa: cada artefato referencia o anterior, permitindo navegar do requisito ate o codigo implementado.

## Como usar

### Instalacao

Na raiz do seu projeto, copie o diretorio do agente que voce utiliza:

**Claude Code:**

```bash
bunx degit direct:https://dev.azure.com/bbts-lab/AI%20Spec%20Driven%20Development/_git/kspec/.claude .claude --force
```

**GitHub Copilot:**

```bash
bunx degit direct:https://dev.azure.com/bbts-lab/AI%20Spec%20Driven%20Development/_git/kspec/.github .github --force
```

**Agents (generico):**

```bash
bunx degit direct:https://dev.azure.com/bbts-lab/AI%20Spec%20Driven%20Development/_git/kspec/.agents .agents --force
```

**Todos os agentes de uma vez:**

```bash
git clone --depth 1 https://dev.azure.com/bbts-lab/AI%20Spec%20Driven%20Development/_git/kspec /tmp/kspec && cp -r /tmp/kspec/.claude /tmp/kspec/.github /tmp/kspec/.agents . && rm -rf /tmp/kspec
```

> Substitua `bunx` por `npx` ou `pnpm dlx` se preferir.

### Configuracao

1. Execute `/kspec-bootstrap` no seu agente de IA
2. Revise o arquivo de guia gerado (ex: `CLAUDE.bootstrap.md`) e renomeie para o guia principal (ex: `CLAUDE.md`)
3. Use o fluxo de desenvolvimento descrito acima

## Principios de design

- **Linguagem direta** — instrucoes claras com justificativa, sem enfase agressiva
- **Sem repeticao** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → Bugfix
- **Codigo em ingles, specs em portugues** — publicos e propositos diferentes
- **Contexto otimizado** — skills para interacao, agents para trabalho isolado
- **Source of truth unico** — `.agents/` como fonte, demais plataformas sincronizadas
