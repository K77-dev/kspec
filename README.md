# claude-kspec

Kit de especificações e padrões para projetos desenvolvidos com Claude Code.

## Por que este projeto existe

Agentes de IA produzem código melhor quando recebem contexto estruturado. Sem regras claras, cada conversa começa do zero — o agente não sabe qual framework usar, como nomear arquivos, onde salvar artefatos ou qual fluxo seguir.

Este repositório resolve isso fornecendo:

- **Padrões de código** — regras consistentes para TypeScript, React, Hono, testes e logging
- **Fluxo de desenvolvimento estruturado** — do requisito ao bugfix, cada etapa tem uma skill ou agent dedicado
- **Templates padronizados** — PRD, Tech Spec e Tasks seguem formatos previsíveis que se referenciam entre si

## Stack

| Área | Tecnologia |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v4, shadcn/ui (base-nova) |
| Backend | Hono, Bun runtime |
| Testes | Vitest (unit), Playwright (E2E) |
| Package Manager | bun |

## Estrutura

```
.claude/
├── skills/            # Skills invocáveis (/skill-name) — rodam no contexto principal
│   ├── kspec-prd/SKILL.md
│   ├── kspec-techspec/SKILL.md
│   ├── kspec-tasks/SKILL.md
│   ├── kspec-implement-task/SKILL.md
│   ├── kspec-implement-all-tasks/SKILL.md
│   ├── kspec-qa/SKILL.md
│   ├── kspec-bugfix/SKILL.md
│   └── kspec-bootstrap/SKILL.md
├── agents/            # Agents — rodam em contexto isolado
│   ├── kspec-task-runner/AGENT.md
│   ├── kspec-review-runner/AGENT.md
│   └── kspec-qa-runner/AGENT.md
├── rules/             # Padrões de código por domínio
│   ├── code-standards.md
│   ├── http.md
│   ├── logging.md
│   ├── typescript.md
│   ├── react.md
│   └── tests.md
├── templates/         # Templates usados pelas skills
│   ├── prd-template.md
│   ├── techspec-template.md
│   ├── tasks-template.md
│   ├── task-template.md
│   └── claude-md-template.md
spec/
└── tasks/             # Artefatos gerados (PRDs, techspecs, tasks, reviews)
CLAUDE.md              # Guia principal do projeto
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
  └→ testa fluxos E2E com Playwright MCP
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

Na raiz do seu projeto, execute um dos comandos abaixo:

**Repo público:**

```bash
bunx degit K77-dev/claude-kspec/.claude .claude --force   # bun
npx degit K77-dev/claude-kspec/.claude .claude --force    # npm
pnpm dlx degit K77-dev/claude-kspec/.claude .claude --force  # pnpm
```

**Repo privado** (usa suas credenciais SSH):

```bash
git clone --depth 1 git@github.com:K77-dev/claude-kspec.git /tmp/claude-kspec && cp -r /tmp/claude-kspec/.claude . && rm -rf /tmp/claude-kspec
```

### Configuração

1. Execute `/kspec-bootstrap` no Claude Code
2. Revise o `CLAUDE.bootstrap.md` gerado e renomeie para `CLAUDE.md`
3. Use o fluxo de desenvolvimento descrito acima

## Princípios de design

- **Linguagem direta** — instruções claras com justificativa, sem ênfase agressiva
- **Sem repetição** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → Bugfix
- **Código em inglês, specs em português** — públicos e propósitos diferentes
- **Contexto otimizado** — skills para interação, agents para trabalho isolado
