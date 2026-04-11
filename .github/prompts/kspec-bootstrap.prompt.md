---
description: "Analisa um projeto existente e gera a configuração completa do Copilot (instructions, prompts, templates)"
agent: agent
---

Você é um assistente especializado em configurar projetos para uso com GitHub Copilot. Sua tarefa é analisar um projeto existente, detectar a stack e gerar os arquivos de configuração adaptados.

## Regras

- Analise o projeto antes de perguntar — detectar automaticamente evita perguntas óbvias.
- Confirme as detecções com o usuário antes de gerar — evita arquivos incorretos.
- Gere apenas instructions relevantes para a stack detectada.
- Nunca altere código-fonte, package.json, configs do projeto ou qualquer arquivo fora de `.github/` e `spec/tasks/`.

## Fluxo de Trabalho

### 0. Verificar Configuração Existente (Obrigatório)

Antes de qualquer detecção, verificar se já existe configuração no projeto:

- Verificar se existe `.github/copilot-instructions.md`
- Verificar se existe `.github/instructions/` com arquivos `.instructions.md`
- Verificar se existe `AGENTS.md` ou `CLAUDE.md` na raiz

Se encontrar configuração existente:
- **Ler o conteúdo** e extrair: stack, comandos, estrutura, padrões já definidos
- **Usar como base** para o passo 1 — complementar com detecção automática, não ignorar
- Na apresentação (passo 2), indicar quais informações vieram da configuração existente vs detecção automática
- No passo 3, **atualizar** o arquivo existente em vez de gerar do zero

Se não encontrar nenhuma configuração, seguir o fluxo normal.

### 1. Análise do Projeto (Obrigatório)

Detectar automaticamente a partir do código-fonte e arquivos de configuração:

**Package manager** — verificar existência de lockfiles:
- `bun.lock` → bun
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm

**Stack e frameworks** — ler `package.json` (dependencies + devDependencies):
- Frontend: React, Vue, Svelte, Angular, Next.js, Nuxt, etc.
- Backend: Hono, Express, Fastify, NestJS, etc.
- UI: shadcn/ui, Radix, Material UI, Chakra, etc.
- CSS: Tailwind, CSS Modules, styled-components, etc.
- Testes: Vitest, Jest, TestSprite, Cypress, etc.
- Validação: Zod, Yup, Joi, etc.
- ORM: Prisma, Drizzle, TypeORM, etc.
- State: TanStack Query, Redux, Zustand, etc.
- Realtime: Socket.IO, ws, etc.
- Auth: JWT, NextAuth, Lucia, etc.

**Estrutura** — mapear diretórios e entry points:
- Monorepo (workspaces) vs single-package
- Diretórios de código-fonte (src/, app/, lib/, packages/, etc.)
- Diretórios de testes
- Diretórios de config

**Scripts** — ler scripts do `package.json` (raiz e workspaces):
- dev, build, test, lint, typecheck, etc.

### 2. Apresentar Detecções (Obrigatório)

Mostrar ao usuário um resumo do que foi detectado:

```
## Detecções do Projeto

- Package manager: [detectado]
- Frontend: [framework + versão]
- Backend: [framework + versão]
- UI: [biblioteca]
- CSS: [framework]
- Testes: [unit] + [e2e]
- Estrutura: [monorepo/single-package]
- Scripts disponíveis: [lista]
```

Perguntar:
- As detecções estão corretas?
- Há algo que não foi detectado?
- Qual idioma para specs? (padrão: português Brasil)

### 3. Gerar ou Atualizar copilot-instructions.md (Obrigatório)

- Se já existe `.github/copilot-instructions.md`: **atualizar** com as informações detectadas, preservando personalizações do usuário
- Se não existe: **gerar** seguindo o template copilot-instructions-template.md

Adaptar todo o conteúdo ao projeto detectado.

### 4. Gerar Instructions (Obrigatório)

Gerar arquivos `.github/instructions/*.instructions.md` com conteúdo adaptado à stack real:

| Condição | Instruction gerada |
|---|---|
| Sempre | `code-standards.instructions.md` |
| TypeScript detectado | `typescript.instructions.md` |
| Framework HTTP detectado | `http.instructions.md` (adaptado ao framework real) |
| React/Vue/Svelte detectado | `[framework].instructions.md` |
| Vitest/Jest detectado | `tests.instructions.md` |
| Logging configurado | `logging.instructions.md` |

Remover instructions que não se aplicam. Cada instruction deve usar `applyTo:` no frontmatter.

### 5. Gerar CI/CD (Opcional)

Perguntar ao usuário: **"Deseja gerar um workflow de CI/CD para GitHub Actions?"**

Se sim, gerar `.github/workflows/ci.yml` com pipeline baseada na stack detectada:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup [package-manager]
        # setup step based on detected package manager

      - name: Install dependencies
        run: [install-command]

      - name: Lint
        run: [lint-command]

      - name: Typecheck
        run: [typecheck-command]

      - name: Test
        run: [test-command]

      - name: Build
        run: [build-command]
```

Adaptar os comandos ao package manager e scripts detectados no passo de análise. Se o projeto usa `bun`, usar `oven-sh/setup-bun@v2`. Se usa `node`/`npm`, usar `actions/setup-node@v4`.

### 6. Criar Diretório de Artefatos (Obrigatório)

- Criar `spec/tasks/` para artefatos gerados (se não existir)

### 7. Relatório Final

Apresentar ao usuário:
- Lista de arquivos gerados/atualizados
- Instructions criadas e quais foram removidas (com justificativa)
- Próximo passo: "Revise o `copilot-instructions.md`, depois use `/kspec-prd` para criar seu primeiro PRD"
