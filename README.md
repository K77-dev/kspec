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
│   ├── prd/SKILL.md
│   ├── techspec/SKILL.md
│   ├── tasks/SKILL.md
│   ├── implement/SKILL.md
│   ├── bugfix/SKILL.md
│   └── bootstrap/SKILL.md
├── agents/            # Agents — rodam em contexto isolado
│   ├── review/AGENT.md
│   └── qa/AGENT.md
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
│   └── task-template.md
spec/
└── tasks/             # Artefatos gerados (PRDs, techspecs, tasks, reviews)
CLAUDE.md              # Guia principal do projeto
```

## Skills, Agents e Rules

### Por que separar em skills e agents?

| Tipo | Contexto | Quando usar |
|---|---|---|
| **Skills** | Principal — descrição carrega no início, conteúdo ao invocar | Workflows que precisam de interação com o usuário |
| **Agents** | Isolado — contexto separado, só o resultado volta | Tarefas autocontidas que produzem relatórios |
| **Rules** | Carregam automaticamente (com ou sem path filter) | Padrões de código por domínio |

### Configuração inicial

#### /bootstrap

Analisa um projeto existente e gera a configuração completa do Claude Code.

- Detecta stack, package manager, frameworks e estrutura automaticamente
- Confirma detecções com o usuário antes de gerar
- Cria CLAUDE.md, rules, skills, agents e templates adaptados ao projeto

## Fluxo de desenvolvimento

```
/prd → /techspec → /tasks → /implement → agent review → agent qa → /bugfix
```

### Skills (contexto principal)

#### /prd

Cria um Documento de Requisitos de Produto (PRD) a partir de uma solicitação de funcionalidade.

- Faz perguntas de clarificação antes de redigir
- Foca no **O QUÊ** e **POR QUÊ**, nunca no como
- Salva em `spec/tasks/prd-[nome]/prd.md`

#### /techspec

Traduz um PRD em especificação técnica com decisões arquiteturais.

- Analisa o código existente antes de especificar
- Foca no **COMO** implementar os requisitos do PRD
- Salva em `spec/tasks/prd-[nome]/techspec.md`

#### /tasks

Quebra a Tech Spec em tarefas incrementais e independentes.

- Mostra lista high-level para aprovação antes de detalhar
- Cada tarefa é um entregável funcional com testes
- Salva em `spec/tasks/prd-[nome]/tasks.md` e `[num]_task.md`

#### /implement

Implementa a próxima tarefa disponível.

- Lê PRD, Tech Spec e definição da tarefa antes de codar
- Carrega skills relevantes e executa checks obrigatórios
- Aciona o agent `review` antes de marcar como completa

#### /bugfix

Corrige bugs documentados pelo QA.

- Resolve causa raiz, na ordem de severidade
- Cria testes de regressão para cada correção
- Gera relatório em `spec/tasks/prd-[nome]/bugfix.md`

### Agents (contexto isolado)

#### review

Realiza code review do código implementado.

- Analisa mudanças via git diff contra TechSpec, Tasks e rules
- Executa todos os checks (`lint`, `typecheck`, `build`, `test`)
- Gera relatório em `spec/tasks/prd-[nome]/review.md`
- **Roda em contexto isolado** — a análise detalhada não consome o contexto principal

#### qa

Valida a implementação completa com testes E2E e acessibilidade.

- Usa Playwright MCP para testar cada fluxo
- Verifica acessibilidade seguindo WCAG 2.2
- Documenta bugs em `bugs.md`, relatório em `spec/tasks/prd-[nome]/qa.md`
- **Roda em contexto isolado** — output verboso fica separado

## Rules

As rules são carregadas automaticamente pelo Claude Code e definem padrões de código por domínio:

| Rule | Escopo | Carrega quando |
|---|---|---|
| `code-standards.md` | Global | Sempre |
| `typescript.md` | Global | Sempre |
| `http.md` | Backend | `backend/src/**/*.ts` |
| `logging.md` | Backend | `backend/src/**/*.ts` |
| `react.md` | Frontend | `frontend/src/**/*.tsx`, `frontend/src/**/*.ts` |
| `tests.md` | Global | Sempre |

## Como usar

### Instalação

Na raiz do seu projeto, execute um dos comandos abaixo:

```bash
bunx degit K77-dev/claude-kspec/.claude .claude --force   # bun
npx degit K77-dev/claude-kspec/.claude .claude --force    # npm
pnpm dlx degit K77-dev/claude-kspec/.claude .claude --force  # pnpm
```

> Use `--force` para sobrescrever uma pasta `.claude/` existente.

### Configuração

1. Execute `/bootstrap` no Claude Code — ele analisa o projeto e gera `CLAUDE.bootstrap.md`, rules e templates adaptados
2. Revise o `CLAUDE.bootstrap.md` gerado e renomeie para `CLAUDE.md` (ou mescle com um existente)
3. Use o fluxo: `/prd` → `/techspec` → `/tasks` → `/implement` → `/bugfix`
4. Os agents `review` e `qa` são acionados automaticamente pelo fluxo

## Princípios de design

- **Linguagem direta** — instruções claras com justificativa, sem ênfase agressiva
- **Sem repetição** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → Bugfix
- **Código em inglês, specs em português** — públicos e propósitos diferentes
- **Contexto otimizado** — skills para interação, agents para trabalho isolado
