# Instruções do Projeto

Monorepo com bun workspaces: **React 19 + Vite 8** (frontend) e **Hono + Bun** (backend).

## Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação** (PRD, tech spec, tasks, reviews): português (Brasil)

## Regras fundamentais

- **Sempre use `bun`** como package manager — nunca `npm`, `yarn` ou `pnpm`
- O backend usa **Hono** — nunca use Express
- Não use workarounds — prefira correções de causa raiz
- Não execute `git restore`, `git reset`, `git clean` ou comandos destrutivos sem permissão explícita

## Comandos

```bash
bun run dev              # Backend + frontend simultaneamente
bun run build            # Build de todos os workspaces
bun run typecheck        # Typecheck de todos os workspaces
bun run lint             # ESLint (rodar dentro de frontend/)
bun run test             # Testes unitários (Vitest)
bun run test:e2e         # Testes E2E (TestSprite)
bun run test:coverage    # Testes com cobertura
```

Frontend: `localhost:5173` | Backend: `localhost:3000`

## Stack

| Área | Tecnologia |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v4, shadcn/ui (base-nova) |
| Backend | Hono, Bun runtime |
| Testes | Vitest (unit), TestSprite (E2E) |

## Estrutura

```
/                          # Raiz do monorepo (bun workspaces)
├── package.json           # Workspaces: ["backend", "frontend", "shared"]
├── bun.lock               # Lockfile do bun
├── bunfig.toml            # Config do bun (silent runs)
├── tsconfig.base.json     # Config TS base compartilhada
├── tsconfig.json          # Config TS da raiz
├── vitest.config.ts       # Config vitest raiz (projects: frontend, backend)
├── e2e/
│   └── app.spec.ts        # Testes E2E
├── shared/                          # Tipos e utilitários compartilhados entre frontend e backend
│   ├── types/                       # DTOs de API, enums, interfaces de domínio
│   │   └── weather.ts               # Ex: WeatherResponse, ForecastDay (usado por ambos)
│   ├── package.json                 # Workspace shared
│   └── tsconfig.json                # TS config
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # Entry point (renderiza App)
│   │   ├── App.tsx                  # Componente raiz, define rotas e providers globais
│   │   ├── index.css                # CSS global (Tailwind v4)
│   │   ├── components/              # Componentes reutilizáveis da aplicação
│   │   │   ├── ui/                  # Componentes shadcn (base-nova) — não editar manualmente
│   │   │   └── weather-card/        # Componentes de domínio (colocation: código + teste)
│   │   │       ├── weather-card.tsx
│   │   │       └── weather-card.test.tsx
│   │   ├── pages/                   # Componentes de página (uma por rota)
│   │   │   └── home.tsx
│   │   ├── hooks/                   # Custom hooks reutilizáveis
│   │   │   ├── use-weather.ts
│   │   │   └── use-weather.test.ts
│   │   ├── services/                # Funções de acesso a APIs externas (fetch wrappers)
│   │   │   ├── weather-api.ts
│   │   │   └── weather-api.test.ts
│   │   ├── lib/                     # Utilitários genéricos (utils.ts)
│   │   └── assets/                  # Assets estáticos (imagens, SVGs)
│   ├── components.json              # Config shadcn (style: base-nova, icons: lucide)
│   ├── vite.config.ts               # Vite + React + @tailwindcss/vite
│   └── eslint.config.js             # ESLint flat config
└── backend/
    ├── src/
    │   ├── index.ts                 # Entry point: cria app Hono, registra middleware e exporta server
    │   ├── controllers/             # Handlers HTTP (recebe request, chama service, retorna response)
    │   │   ├── health.ts
    │   │   ├── health.test.ts
    │   │   ├── weather.ts
    │   │   └── weather.test.ts
    │   ├── services/                # Regras de negócio e orquestração (camada de aplicação)
    │   │   ├── weather.ts           # Orquestra geocoding + forecast, retorna dados formatados
    │   │   └── weather.test.ts
    │   ├── clients/                 # Clients para APIs e serviços externos
    │   │   ├── geocoding.ts         # Client para Geocoding API (Open-Meteo)
    │   │   ├── geocoding.test.ts
    │   │   ├── forecast.ts          # Client para Forecast API (Open-Meteo)
    │   │   └── forecast.test.ts
    │   ├── middleware/              # Middleware Hono customizado (auth, error handler, logging)
    │   └── schemas/                 # Schemas Zod reutilizáveis (validação de request/response)
    ├── vitest.config.ts             # Config vitest backend
    └── tsconfig.json                # TS config (types: bun)
```

## Checks obrigatórios antes de concluir

1. `bun run lint` (frontend)
2. `bun run typecheck` (frontend + backend)
3. `bun run build` (frontend + backend)
4. `bun run test` (testes unitários)

## Fluxo de desenvolvimento

O projeto segue um fluxo estruturado com artefatos em `spec/tasks/[NNN]-prd-[nome]/`:

```
PRD → Tech Spec → Tasks → Implementação → Review → QA → Bugfix
```

- **PRD** (`prd.md`) — Requisitos de produto com histórias de usuário
- **Tech Spec** (`techspec.md`) — Especificação arquitetural com decisões técnicas
- **Tasks** (`tasks.md` + `[num]_task.md`) — Tarefas incrementais com dependências e testes
- **Review** (`review_[num].md`) — Code review contra spec e regras do projeto
- **QA** (`qa.md` + `bugs.md`) — Testes E2E, acessibilidade WCAG 2.2, bugs documentados
- **Bugfix** (`bugfix.md`) — Correções por severidade com testes de regressão

Templates para cada artefato estão em `.github/templates/`.

## Princípios

- Toda task deve incluir testes unitários e de integração
- Sempre considerar edge cases: input inválido, estados vazios, limites, falhas
- Correções devem resolver a causa raiz, não o sintoma
- Rastreabilidade completa: PRD → Tech Spec → Tasks → Review → QA → Bugfix
