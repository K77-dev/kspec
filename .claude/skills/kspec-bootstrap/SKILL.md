---
name: kspec-bootstrap
version: 1.0.0
description: Analisa um projeto existente e gera a configuração completa do Claude Code (CLAUDE.bootstrap.md, rules adaptadas) baseada na stack, estrutura e convenções detectadas.
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-bootstrap**

Você é um assistente especializado em configurar projetos para uso com Claude Code. Sua tarefa é analisar um projeto existente, detectar a stack e gerar os arquivos de configuração adaptados.

## Regras

- Analise o projeto antes de perguntar — detectar automaticamente evita perguntas óbvias.
- Confirme as detecções com o usuário antes de gerar — evita arquivos incorretos.
- Gere apenas rules relevantes para a stack detectada — rules desnecessárias consomem contexto sem valor.
- Sempre gere `CLAUDE.bootstrap.md` e rules adaptadas, mesmo que já existam — os arquivos em `.claude/rules/` vindos do degit são templates genéricos, não configuração do projeto.
- Nunca altere código-fonte, package.json, configs do projeto ou qualquer arquivo fora de `.claude/`, `CLAUDE.bootstrap.md` e `spec/tasks/`.

## Fluxo de Trabalho

### 0. Verificar Configuração Existente (Obrigatório)

Antes de qualquer detecção, verificar se já existe configuração no projeto:

- Verificar se existe `CLAUDE.md` ou `CLAUDE.bootstrap.md` na raiz
- Verificar se existe `.claude/rules/` com arquivos `.md`
- Verificar se existe `.github/copilot-instructions.md`

Se encontrar configuração existente:
- **Ler o conteúdo** e extrair: stack, comandos, estrutura, padrões já definidos
- **Usar como base** para o passo 1 — complementar com detecção automática, não ignorar
- Na apresentação (passo 2), indicar quais informações vieram da configuração existente vs detecção automática

Se não encontrar nenhuma configuração, seguir o fluxo normal.

### 1. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias.

**Comportamento específico do bootstrap:**
- Exibir mensagem detalhada para cada skill instalada/atualizada
- NÃO permitir fallback offline — se o repositório empresarial não estiver acessível, bloquear o bootstrap com mensagem de erro
- NÃO prossiga para o próximo passo se a validação bloquear a execução

### 2. Análise do Projeto (Obrigatório)

Antes de iniciar a detecção, verificar se o projeto está vazio.

**Critérios de projeto vazio** — o projeto é considerado vazio se **nenhum** dos seguintes existir:
- `package.json`
- `pom.xml` ou `build.gradle`
- Lockfiles (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`)
- Diretórios `src/`, `app/` ou `lib/`

Arquivos de scaffolding kspec (`.claude/`, `.agents/`, `.github/`, `spec/`, `CLAUDE.md`, `README.md`, `enterprise-skills-lock.json`) **não contam** como código-fonte.

- **Se vazio** → seguir passo **2A. Seleção Guiada**
- **Se não vazio** → seguir passo **2B. Detecção Automática**

#### 2A. Seleção Guiada de Stack (Projeto Vazio)

Informar ao usuário que o projeto está vazio e guiá-lo na seleção da stack.

**Pergunta 1 — Composição do projeto:**
1. Somente backend
2. Somente frontend
3. Full-stack (backend + frontend)

**Pergunta 2 — Stack de backend** (se composição inclui backend):
1. Node.js → bun + Hono + Vitest + TypeScript
2. Spring Boot → Maven + JUnit 5 + Java

**Pergunta 3 — Stack de frontend** (se composição inclui frontend):
1. React → Vite + Vitest + TypeScript
2. Angular → Angular CLI + Jest + TypeScript

**Pergunta 4 — Idioma para specs** (padrão: português Brasil)

Após as respostas, seguir para o passo **3A**.

#### 2B. Detecção Automática (Projeto Existente)

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

Após a detecção, seguir para o passo **3B**.

### 3. Confirmar Stack (Obrigatório)

#### 3A. Confirmação da Seleção (Projeto Vazio)

Apresentar resumo da stack selecionada:

```
## Stack Selecionada

- Backend: [Node.js (bun + Hono + Vitest + TypeScript) / Spring Boot (Maven + JUnit 5 + Java) / N/A]
- Frontend: [React (Vite + Vitest + TypeScript) / Angular (Angular CLI + Jest + TypeScript) / N/A]
- Idioma specs: [idioma]
```

Perguntar: Confirma a seleção?

#### 3B. Apresentar Detecções (Projeto Existente)

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

### 4. Gerar CLAUDE.bootstrap.md (Obrigatório)

Sempre gerar `CLAUDE.bootstrap.md` na raiz — nunca sobrescrever um `CLAUDE.md` existente. O usuário decide o que aproveitar.

Seguir a estrutura de seções do template @.claude/templates/claude-md-template.md, adaptando **todo o conteúdo** ao projeto detectado ou selecionado.

**Para projetos vazios (vindos do passo 2A):**

- **Comandos do projeto**: gerar comandos esperados da stack selecionada:
  - Node.js: `bun install`, `bun dev`, `bun test`, `bun run build`, `bun run lint`
  - Spring Boot: `./mvnw spring-boot:run`, `./mvnw test`, `./mvnw package`, `./mvnw verify`
  - React (Vite): `bun install`, `bun dev`, `bun test`, `bun run build`
  - Angular: `ng serve`, `ng test`, `ng build`, `ng lint`
- **Estrutura do projeto**: gerar estrutura recomendada para a stack (não existe árvore real para mapear)

### 5. Selecionar Rules do Enterprise (Obrigatório)

As rules de stack estão no repositório enterprise (não no core kspec). O bootstrap seleciona as rules relevantes baseado na stack detectada ou selecionada no passo 2.

**5.1. Listar rules disponíveis no enterprise cache:**

```bash
ls .claude/.enterprise-skills-cache/.agents/rules/
```

O enterprise repo organiza rules por categoria:
```
rules/
├── languages/        # typescript.md, java.md, python.md
├── backend/          # hono.md, express.md, spring-boot.md
├── frontend/         # react.md, angular.md, vue.md
├── styling/          # tailwind.md, css-modules.md
├── testing/          # vitest.md, jest.md, junit.md
├── package-managers/ # bun.md, npm.md, maven.md
└── validation/       # zod.md, joi.md
```

**5.2. Selecionar rules baseado na stack detectada ou selecionada:**

**Para projetos existentes (passo 2B)** — selecionar por detecção:

| Condição | Rule selecionada do enterprise |
|---|---|
| TypeScript detectado | `languages/typescript.md` |
| Framework HTTP detectado | `backend/{framework}.md` |
| React/Vue/Angular detectado | `frontend/{framework}.md` |
| Tailwind/CSS Modules detectado | `styling/{framework}.md` |
| Vitest/Jest detectado | `testing/{test-runner}.md` |
| bun/npm/pnpm detectado | `package-managers/{pm}.md` |
| Zod/Joi/Yup detectado | `validation/{lib}.md` |

**Para projetos vazios (passo 2A)** — selecionar por mapeamento fixo:

| Stack selecionada | Rules do enterprise |
|---|---|
| Node.js backend | `languages/typescript.md`, `backend/hono.md`, `testing/vitest.md`, `package-managers/bun.md` |
| Spring Boot backend | `languages/java.md`, `backend/spring-boot.md`, `testing/junit.md`, `package-managers/maven.md` |
| React frontend | `languages/typescript.md`, `frontend/react.md`, `testing/vitest.md` |
| Angular frontend | `languages/typescript.md`, `frontend/angular.md`, `testing/jest.md` |

Em full-stack: usar a união dos dois conjuntos (sem duplicatas).

**5.3. Copiar rules selecionadas para o projeto:**

```bash
cp .claude/.enterprise-skills-cache/.agents/rules/{category}/{rule}.md .agents/rules/{rule}.md
```

**5.4. Rules do core kspec (sempre presentes):**

| Rule | Descrição |
|---|---|
| `code-standards.md` | Nomenclatura, formatação, SOLID — universal |
| `database.md` | Padrões genéricos de ORM/DB |
| `logging.md` | Níveis e estrutura de logging |

Não remover estas rules — elas vêm com o core kspec e são technology-agnostic.

**5.5. Remover rules que não se aplicam:**

Se existirem rules de stack em `.agents/rules/` que não correspondem a nenhuma tecnologia detectada, removê-las (ex: `react.md` num projeto Angular).

**5.6. Ajustar `paths:` no frontmatter:**

Após copiar as rules, ajustar o frontmatter `paths:` de cada rule para refletir a estrutura real do projeto (ex: `frontend/src/**/*.tsx` em vez de `**/*.tsx`). Para projetos vazios, manter os paths genéricos padrão da rule (`**/*.ts`, `**/*.java`, etc.).

### 6. Gerar CI/CD (Opcional)

Perguntar ao usuário: **"Deseja gerar um workflow de CI/CD para GitHub Actions?"**

Se sim, gerar `.github/workflows/ci.yml` com pipeline baseada na stack detectada ou selecionada:

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

### 7. Criar Diretório de Artefatos (Obrigatório)

- Criar `spec/tasks/` para os artefatos gerados (se não existir)

### 8. Relatório Final

Apresentar ao usuário:

- Lista de arquivos gerados/atualizados
- Rules criadas e quais foram removidas (com justificativa)
- Próximo passo: "Revise o `CLAUDE.bootstrap.md`, renomeie para `CLAUDE.md` quando estiver satisfeito, depois use `/prd` para criar seu primeiro PRD"

## Checklist de Qualidade

- [ ] Projeto vazio: seleção guiada oferecida (se aplicável)
- [ ] Projeto existente: analisado (package.json, lockfiles, configs — não os arquivos em .claude/)
- [ ] Stack confirmada com o usuário (seleção guiada ou detecções)
- [ ] CLAUDE.bootstrap.md gerado com conteúdo adaptado à stack real
- [ ] Rules geradas/atualizadas apenas para tecnologias detectadas
- [ ] Rules irrelevantes removidas
- [ ] Path-specific rules configuradas onde aplicável
- [ ] CI/CD oferecido ao usuário (e gerado se aceito)
- [ ] Diretório spec/tasks/ criado
- [ ] Relatório final apresentado
