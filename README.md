# kspec

Kit de especificações e padrões para projetos desenvolvidos com agentes de IA — compatível com **Claude Code**, **Gemini CLI**, **GitHub Copilot** e **Agents (genérico)**.

## Por que este projeto existe

Agentes de IA produzem código melhor quando recebem contexto estruturado. Sem regras claras, cada conversa começa do zero — o agente não sabe qual framework usar, como nomear arquivos, onde salvar artefatos ou qual fluxo seguir.

Este repositório resolve isso fornecendo:

- **Padrões de código** — regras consistentes para TypeScript, React, Hono, testes e logging
- **Fluxo de desenvolvimento estruturado** — do requisito ao bugfix, cada etapa tem uma skill ou agent dedicado
- **Templates padronizados** — PRD, Tech Spec e Tasks seguem formatos previsíveis que se referenciam entre si
- **Multi-agente** — mesmas skills, agents, rules e templates adaptados para Claude Code, Gemini CLI e GitHub Copilot

## Agentes suportados

| Agente | Diretório de config | Guia principal | Skills | Agents | Rules | Templates |
|---|---|---|---|---|---|---|
| Claude Code | `.claude/` | `CLAUDE.md` | `.claude/skills/` | `.claude/agents/` | `.claude/rules/` | `.claude/templates/` |
| Gemini CLI | `.gemini/` | `GEMINI.md` | `.gemini/skills/` | `.gemini/agents/` | `.gemini/rules/` | `.gemini/templates/` |
| GitHub Copilot | `.github/` | `.github/copilot-instructions.md` | `.github/prompts/` | `.github/prompts/` | `.github/instructions/` | `.github/templates/` |
| Agents (genérico) | `.agents/` | `AGENTS.md` | `.agents/skills/` | `.agents/agents/` | `.agents/rules/` | `.agents/templates/` |

## Stack

| Área | Tecnologia |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v4, shadcn/ui (base-nova) |
| Backend | Hono, Bun runtime |
| Testes | Vitest (unit), TestSprite (E2E) |
| Package Manager | bun |

## Estrutura

```
.claude/                        # Configuração Claude Code
├── skills/                     # Skills invocáveis (cada uma em sua pasta)
├── agents/                     # Agents (executam tarefas isoladas)
├── rules/                      # Padrões de código por domínio
├── templates/                  # Templates usados pelas skills
└── validation/                 # Validações de skills empresariais
.gemini/                        # Configuração Gemini CLI
├── skills/                     # Skills Gemini (mesmo fluxo do Claude)
├── agents/                     # Agents Gemini
├── rules/                      # Regras Gemini
└── templates/                  # Templates Gemini
.github/                        # Configuração GitHub Copilot
├── copilot-instructions.md     # Guia principal do Copilot
├── prompts/                    # Skills e agents como prompts reutilizáveis
├── instructions/               # Instruções de domínio (equivalente a rules)
└── templates/                  # Templates de specs
.agents/                        # Configuração genérica (ferramentas compatíveis com .agents)
├── skills/                     # Skills invocáveis
├── agents/                     # Agents (tarefas isoladas)
├── rules/                      # Padrões de código por domínio
├── templates/                  # Templates usados pelas skills
└── validation/                 # Validações de skills empresariais
spec/
└── tasks/                      # Artefatos gerados (PRDs, techspecs, tasks, reviews)
CLAUDE.md                       # Guia principal para Claude Code
GEMINI.md                       # Guia principal para Gemini CLI
AGENTS.md                       # Guia principal para Agents (genérico)
README.md                       # Este arquivo
```

## Skills, Agents e Rules

| Tipo | Contexto | Quando usar |
|---|---|---|
| **Skills** | Principal — descrição carrega no início, conteúdo ao invocar | Workflows que precisam de interação com o usuário |
| **Agents** | Isolado — contexto separado, só o resultado volta | Tarefas autocontidas que produzem relatórios |
| **Rules** | Carregam automaticamente (com ou sem path filter) | Padrões de código por domínio |

## Fluxo de desenvolvimento

### Setup (uma vez por projeto)

#### /kspec-bootstrap

Analisa um projeto existente e gera a configuração completa do Claude Code.

- Detecta stack, package manager, frameworks e estrutura automaticamente
- Confirma detecções com o usuário antes de gerar
- Cria CLAUDE.bootstrap.md, rules e templates adaptados ao projeto

```
/kspec-bootstrap
  └→ detecta stack, package manager, frameworks e estrutura
  └→ confirma detecções com o usuário
  └→ gera CLAUDE.bootstrap.md + rules adaptadas
  └→ dev revisa e renomeia para CLAUDE.md
```

### Especificação (por funcionalidade)

#### /kspec-prd

Cria um Documento de Requisitos de Produto (PRD) a partir de uma solicitação de funcionalidade.

```
/kspec-prd
  └→ faz perguntas de clarificação ao usuário
  └→ planeja abordagem seção por seção
  └→ redige o PRD seguindo o template
  └→ salva em spec/tasks/[NNN]-prd-[nome]/prd.md
```

#### /kspec-techspec

Traduz um PRD em especificação técnica com decisões arquiteturais.

```
/kspec-techspec
  └→ lê o PRD e analisa o projeto existente
  └→ faz perguntas técnicas ao usuário
  └→ gera spec arquitetural seguindo o template
  └→ salva em spec/tasks/[NNN]-prd-[nome]/techspec.md
```

#### /kspec-tasks

Quebra a Tech Spec em tarefas incrementais e independentes.

```
/kspec-tasks
  └→ lê PRD + Tech Spec
  └→ mostra lista high-level para aprovação
  └→ gera arquivos de tasks individuais
  └→ salva em spec/tasks/[NNN]-prd-[nome]/tasks.md + [num]_task.md
```

### Implementação (por task)

#### /kspec-implement-task

Implementa a próxima tarefa disponível. Uso manual, uma task por vez.

```
/kspec-implement-task
  └→ identifica próxima task pendente
  └→ delega ao agent kspec-task-runner (contexto isolado)
  └→ delega ao agent kspec-review-runner (contexto isolado)
  └→ aprovado com ressalvas → reimplementa para corrigir (1 chance)
  └→ reprovado → reimplementa (até 2x), depois para com lista de problemas
  └→ marca como completa em tasks.md
  └→ apresenta resumo com status real da review e arquivo gerado
```

#### /kspec-implement-all-tasks

Executa todas as tasks pendentes de forma automatizada (sequencial ou paralelo).

```
/kspec-implement-all-tasks
  └→ lê tasks.md e identifica tasks pendentes
  └→ analisa dependências e identifica oportunidades de paralelismo
  └→ se houver paralelismo possível, pergunta ao usuário: sequencial ou paralelo?
  └→ apresenta lista ao usuário para confirmação
  └→ para cada task (ou lote de tasks em paralelo):
      └→ delega ao agent kspec-task-runner (contexto isolado)
      └→ delega ao agent kspec-review-runner (contexto isolado)
      └→ aprovado com ressalvas → reimplementa para corrigir (1 chance)
      └→ reprovado → reimplementa (até 2x), depois para com lista de problemas
      └→ marca como completa em tasks.md
  └→ gera relatório final com status real de cada review e arquivos gerados
```

### QA (manual, por funcionalidade)

#### /kspec-qa

Executa Quality Assurance da funcionalidade completa. Invocação manual — o dev decide quando a funcionalidade está pronta.

```
/kspec-qa
  └→ delega ao agent kspec-qa-runner (contexto isolado)
  └→ testa fluxos E2E com TestSprite MCP
  └→ verifica acessibilidade (WCAG 2.2)
  └→ gera qa.md + bugs.md
  └→ APROVADO → funcionalidade pronta
  └→ REPROVADO → dev roda /kspec-bugfix
```

### Bugfix (manual, se necessário)

#### /kspec-bugfix

Corrige bugs documentados pelo QA. Resolve causa raiz e cria testes de regressão.

```
/kspec-bugfix
  └→ lê bugs.md
  └→ corrige causa raiz na ordem de severidade (Alta → Média → Baixa)
  └→ cria testes de regressão para cada correção
  └→ roda checks (conforme CLAUDE.md)
  └→ atualiza bugs.md com status das correções
  └→ gera bugfix.md
  └→ dev pode rodar /kspec-qa novamente
```

### Artefatos gerados por funcionalidade

```
spec/tasks/[NNN]-prd-[nome]/
├── prd.md          ← /kspec-prd
├── techspec.md     ← /kspec-techspec
├── tasks.md        ← /kspec-tasks
├── [num]_task.md   ← /kspec-tasks
├── review_[num].md ← agent kspec-review-runner (um por task)
├── qa.md           ← agent kspec-qa-runner
├── bugs.md         ← agent kspec-qa-runner
└── bugfix.md       ← /kspec-bugfix
```

## Agents

Os agents rodam em contexto isolado e são acionados pelas skills — não precisam ser invocados diretamente.

| Agent | Acionado por | Função |
|---|---|---|
| `kspec-task-runner` | `/kspec-implement-task`, `/kspec-implement-all-tasks` | Implementa uma task individual em contexto isolado |
| `kspec-review-runner` | `/kspec-implement-task`, `/kspec-implement-all-tasks` | Code review contra TechSpec, Tasks e rules |
| `kspec-qa-runner` | `/kspec-qa` | Testa E2E, acessibilidade, visual |

## Rules

As rules são carregadas automaticamente pelo Claude Code e definem padrões de código por domínio:

| Rule | Escopo | Carrega quando |
|---|---|---|
| `code-standards.md` | Global | Sempre |
| `typescript.md` | Global | Sempre |
| `http.md` | Backend | `backend/src/**/*.ts` |
| `logging.md` | Backend | `backend/src/**/*.ts` |
| `react.md` | Frontend | `frontend/src/**/*.tsx`, `frontend/src/**/*.ts` |
| `tests.md` | Testes | `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts` |

## Como usar

### Instalação

Na raiz do seu projeto, copie o diretório do agente que você utiliza:

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

**Agents (genérico):**

```bash
bunx degit K77-dev/kspec/.agents .agents --force
```

**Todos os agentes de uma vez:**

```bash
git clone --depth 1 git@github.com:K77-dev/kspec.git /tmp/kspec && cp -r /tmp/kspec/.claude /tmp/kspec/.gemini /tmp/kspec/.github /tmp/kspec/.agents . && rm -rf /tmp/kspec
```

> Substitua `bunx` por `npx` ou `pnpm dlx` se preferir.

### Configuração

1. Execute `/kspec-bootstrap` no seu agente de IA
2. Revise o arquivo de guia gerado (ex: `CLAUDE.bootstrap.md`) e renomeie para o guia principal (ex: `CLAUDE.md`)
3. Use o fluxo de desenvolvimento descrito acima

## Princípios de design

- **Linguagem direta** — instruções claras com justificativa, sem ênfase agressiva
- **Sem repetição** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → Bugfix
- **Código em inglês, specs em português** — públicos e propósitos diferentes
- **Contexto otimizado** — skills para interação, agents para trabalho isolado
