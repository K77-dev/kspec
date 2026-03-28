# claude-kspec

Kit de especificações e padrões para projetos desenvolvidos com Claude Code.

## Por que este projeto existe

Agentes de IA produzem código melhor quando recebem contexto estruturado. Sem regras claras, cada conversa começa do zero — o agente não sabe qual framework usar, como nomear arquivos, onde salvar artefatos ou qual fluxo seguir.

Este repositório resolve isso fornecendo:

- **Padrões de código** — regras consistentes para TypeScript, React, Hono, testes e logging
- **Fluxo de desenvolvimento estruturado** — do requisito ao bugfix, cada etapa tem um comando dedicado
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
├── commands/          # Comandos executáveis (/command-name)
│   ├── prd.md
│   ├── techspec.md
│   ├── tasks.md
│   ├── implement.md
│   ├── review.md
│   ├── qa.md
│   └── bugfix.md
├── rules/             # Padrões de código por domínio
│   ├── code-standards.md
│   ├── http.md
│   ├── logging.md
│   ├── typescript.md
│   ├── react.md
│   └── tests.md
spec/
└── templates/         # Templates usados pelos comandos
    ├── prd-template.md
    ├── techspec-template.md
    ├── tasks-template.md
    └── task-template.md
CLAUDE.md              # Guia principal do projeto
```

## Comandos

Os comandos seguem um fluxo sequencial de desenvolvimento. Cada etapa produz artefatos que alimentam a próxima.

### Fluxo completo

```
/prd → /techspec → /tasks → /implement → /review → /qa → /bugfix
```

### /prd

Cria um Documento de Requisitos de Produto (PRD) a partir de uma solicitação de funcionalidade.

- Faz perguntas de clarificação antes de redigir
- Foca no **O QUÊ** e **POR QUÊ**, nunca no como
- Salva em `spec/tasks/prd-[nome]/prd.md`

### /techspec

Traduz um PRD em especificação técnica com decisões arquiteturais.

- Analisa o código existente antes de especificar
- Foca no **COMO** implementar os requisitos do PRD
- Salva em `spec/tasks/prd-[nome]/techspec.md`

### /tasks

Quebra a Tech Spec em tarefas incrementais e independentes.

- Mostra lista high-level para aprovação antes de detalhar
- Cada tarefa é um entregável funcional com testes
- Salva em `spec/tasks/prd-[nome]/tasks.md` e `[num]_task.md`

### /implement

Implementa a próxima tarefa disponível.

- Lê PRD, Tech Spec e definição da tarefa antes de codar
- Carrega skills relevantes e executa checks obrigatórios
- Aciona `/review` antes de marcar como completa

### /review

Realiza code review do código implementado.

- Analisa mudanças via git diff contra TechSpec, Tasks e rules
- Executa todos os checks (`lint`, `typecheck`, `build`, `test`)
- Gera relatório em `spec/tasks/prd-[nome]/review.md`

### /qa

Valida a implementação completa com testes E2E e acessibilidade.

- Usa Playwright MCP para testar cada fluxo
- Verifica acessibilidade seguindo WCAG 2.2
- Documenta bugs em `bugs.md`, relatório em `spec/tasks/prd-[nome]/qa.md`

### /bugfix

Corrige bugs documentados pelo QA.

- Resolve causa raiz, na ordem de severidade
- Cria testes de regressão para cada correção
- Gera relatório em `spec/tasks/prd-[nome]/bugfix.md`

## Rules

As rules são carregadas automaticamente pelo Claude Code e definem padrões de código por domínio:

| Rule | Escopo | Conteúdo |
|---|---|---|
| `code-standards.md` | Global | Nomenclatura, formatação, constantes, funções, condicionais |
| `typescript.md` | Global | TypeScript, bun, variáveis, imports, tipagem forte |
| `http.md` | Backend | Hono, REST, status HTTP, middlewares, fetch |
| `logging.md` | Backend | Níveis de log, dados sensíveis, estrutura |
| `react.md` | Frontend | Componentes funcionais, hooks, Tailwind v4, shadcn/ui |
| `tests.md` | Global | Vitest, estrutura AAA/GWT, mocks, cobertura |

## Como usar

1. Copie a pasta `.claude/`, `spec/` e o `CLAUDE.md` para a raiz do seu projeto
2. Ajuste o `CLAUDE.md` com a stack e estrutura do seu projeto
3. Ajuste as rules conforme suas convenções
4. Execute os comandos no Claude Code: `/prd`, `/techspec`, etc.

## Princípios de design

- **Linguagem direta** — instruções claras com justificativa, sem ênfase agressiva
- **Sem repetição** — cada regra aparece uma vez, no lugar certo
- **Rastreabilidade** — PRD → Tech Spec → Tasks → Review → QA → Bugfix
- **Código em inglês, specs em português** — públicos e propósitos diferentes
