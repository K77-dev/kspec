# GEMINI.md

Guia para agentes de IA ao trabalhar com o código deste repositório.

Este projeto é um **monorepo com bun workspaces** usando **React 19 + Vite 8** no frontend e **Hono + Bun** no backend.

### Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação de projeto** (PRD, tech spec, tasks, reviews): português (Brasil)

### Prioridades

- **Sempre consulte as skills** antes de implementar — tarefas sem skills relevantes podem ser invalidadas
- **Execute os checks** antes de concluir: `bun run lint` (frontend), `bun run typecheck` (frontend + backend), `bun run build` (frontend + backend), `bun run test` (unit tests)
- **Não use workarounds** — prefira correções de causa raiz
- **Use `bun add <pacote>`** para adicionar dependências (nunca edite `package.json` manualmente sem conferir a versão)
- **Sempre use `bun`** como package manager — nunca use `npm`, `yarn` ou `pnpm`
- **O backend usa Hono** — nunca use Express

### Comandos do projeto

```bash
# Raiz (monorepo)
bun run dev              # Inicia backend + frontend simultaneamente (concurrently)
bun run dev:backend      # Apenas backend
bun run dev:frontend     # Apenas frontend
bun run build            # Build de todos os workspaces
bun run typecheck        # Typecheck de todos os workspaces
bun run test             # Testes unitários (vitest) de todos os workspaces
bun run test:watch       # Testes em modo watch
bun run test:coverage    # Testes com cobertura
bun run test:e2e         # Testes E2E (Playwright)
bun run test:e2e:ui      # Testes E2E com UI do Playwright

# Frontend (dentro de frontend/)
cd frontend
bun run dev              # Servidor de desenvolvimento (Vite)
bun run build            # tsc -b + vite build
bun run lint             # ESLint
bun run typecheck        # tsc -b
bun run test             # Vitest

# Backend (dentro de backend/)
cd backend
bun run dev              # Servidor com bun --watch
bun run build            # bun build (target bun)
bun run start            # Executar build
bun run typecheck        # tsc --noEmit
bun run test             # Vitest
```

- O frontend roda na porta `localhost:5173`
- O backend roda na porta `localhost:3000`

### Stack e skills recomendadas

| Área              | Tecnologia                          | Skill sugerida                                                        |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Componentes React | React 19, hooks                     | `vercel-react-best-practices`, `vercel-composition-patterns`          |
| UI / shadcn       | shadcn/ui (base-nova), Tailwind v4  | `shadcn`, `frontend-design`                                           |
| Backend           | Hono, Bun runtime                   | `hono`                                                                |
| Testes            | Vitest (unit), Playwright (e2e)     | `vitest`, `a11y-testing`                                              |
| Design / UX       | Interface, acessibilidade           | `ui-ux-pro-max`, `web-design-guidelines`                              |
| PRD               | Requisitos de produto               | skill `kspec-prd`                                                     |
| Tech Spec         | Especificação técnica               | skill `kspec-techspec`                                                |
| Tasks             | Planejamento de tarefas             | skill `kspec-tasks`                                                   |
| Implementação     | Execução de tarefas                 | skill `kspec-implement-task`, skill `kspec-implement-all-tasks`       |
| Code Review       | Revisão de código                   | subagent `kspec-review-runner`                                        |
| QA                | Quality Assurance                   | subagent `kspec-qa-runner`                                            |
| Bugfix            | Correção de bugs                    | skill `kspec-bugfix`                                                  |

### Estrutura do projeto

```
/                          # Raiz do monorepo (bun workspaces)
├── package.json           # Workspaces: ["backend", "frontend"]
├── bun.lock               # Lockfile do bun
├── bunfig.toml            # Config do bun (silent runs)
├── tsconfig.base.json     # Config TS base compartilhada
├── tsconfig.json          # Config TS da raiz
├── vitest.config.ts       # Config vitest raiz (projects: frontend, backend)
├── playwright.config.ts   # Config Playwright (e2e)
├── e2e/
│   └── app.spec.ts        # Testes E2E
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # Entry point (renderiza App)
│   │   ├── App.tsx               # Componente raiz, define rotas e providers globais
│   │   ├── index.css             # CSS global (Tailwind v4)
│   │   ├── components/           # Componentes reutilizáveis da aplicação
│   │   │   ├── ui/               # Componentes shadcn (base-nova) — não editar manualmente
│   │   │   └── weather/          # Componentes de domínio (ex: weather-card.tsx, forecast-list.tsx)
│   │   ├── pages/                # Componentes de página (uma por rota)
│   │   │   └── home.tsx          # Página inicial
│   │   ├── hooks/                # Custom hooks reutilizáveis
│   │   │   └── use-weather.ts    # Hook para buscar dados de clima (fetch + estado)
│   │   ├── services/             # Funções de acesso a APIs externas (fetch wrappers)
│   │   │   └── weather-api.ts    # Client HTTP para /api/weather
│   │   ├── types/                # Tipos e interfaces compartilhados
│   │   │   └── weather.ts        # Tipos de domínio (WeatherData, ForecastDay, etc.)
│   │   ├── lib/                  # Utilitários genéricos (utils.ts)
│   │   ├── assets/               # Assets estáticos (imagens, SVGs)
│   │   └── __tests__/            # Testes unitários do frontend
│   │       ├── components/       # Testes de componentes (render + interação)
│   │       ├── hooks/            # Testes de custom hooks
│   │       └── services/         # Testes de services (mocks de fetch)
│   ├── components.json           # Config shadcn (style: base-nova, icons: lucide)
│   ├── vite.config.ts            # Vite + React + @tailwindcss/vite
│   └── eslint.config.js          # ESLint flat config
└── backend/
    ├── src/
    │   ├── index.ts              # Entry point: cria app Hono, registra middleware global (CORS) e exporta server
    │   ├── routes/               # Definição de rotas e controllers (camada HTTP)
    │   │   ├── health.ts         # GET /health
    │   │   └── weather.ts        # GET /api/weather (validação Zod, chama service)
    │   ├── services/             # Regras de negócio e orquestração (camada de aplicação)
    │   │   └── weather.ts        # Orquestra geocoding + forecast, retorna dados formatados
    │   ├── data/                 # Acesso a dados e integrações externas (camada de dados)
    │   │   ├── geocoding.ts      # Client para Geocoding API (Open-Meteo)
    │   │   └── forecast.ts       # Client para Forecast API (Open-Meteo)
    │   └── __tests__/            # Testes unitários do backend
    │       ├── routes/           # Testes de rotas (integração HTTP)
    │       ├── services/         # Testes de services (lógica de negócio)
    │       └── data/             # Testes de clients de dados
    ├── vitest.config.ts          # Config vitest backend
    └── tsconfig.json             # TS config (types: bun)
```

### React

- Componentes funcionais, props tipadas, composição

@./.gemini/rules/react.md

### Testes

- **Unit**: Vitest | **E2E**: Playwright

@./.gemini/rules/tests.md

### Git

- **Não execute** `git restore`, `git reset`, `git clean` ou comandos destrutivos **sem permissão explícita do usuário**

### Anti-padrões

1. Ignorar skills disponíveis antes de implementar
2. Ativar apenas uma skill quando o código toca vários domínios
3. Esquecer verificação antes de marcar tarefa concluída
4. Executar comandos git destrutivos sem permissão do usuário
5. Evite fazer workarounds
6. Usar `npm`, `yarn` ou `pnpm` em vez de `bun`
7. Referenciar Express — o backend usa Hono

### Rules do projeto

@./.gemini/rules/code-standards.md
@./.gemini/rules/http.md
@./.gemini/rules/logging.md
@./.gemini/rules/react.md
@./.gemini/rules/tests.md
@./.gemini/rules/typescript.md
