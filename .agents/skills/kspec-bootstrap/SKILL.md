---
name: kspec-bootstrap
version: 1.3.0
description: Analisa um projeto existente e gera a configuração completa do kspec (CLAUDE.bootstrap.md, AGENTS.bootstrap.md e/ou CURSOR.bootstrap.md, rules adaptadas) baseada na stack, estrutura e plataformas escolhidas (Claude Code, Codex CLI, Cursor ou combinações).
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.3.0 — kspec-bootstrap**

## Limitação em Modo Não-Interativo

**IMPORTANTE:** Esta skill usa ferramentas interativas para coletar escolhas do usuário. Elas **não funcionam em modo não-interativo** (ex.: `codex exec`, automações batch ou sessões sem capacidade de perguntar ao usuário).

Se você detectar execução não-interativa (ausência de contexto interativo, variáveis de ambiente indicando modo batch, ou impossibilidade de invocar a ferramenta interativa da plataforma):

1. Exiba a seguinte mensagem de erro:
   ```
   ✗ kspec-bootstrap requer modo interativo.

   Esta skill utiliza perguntas estruturadas para coletar escolhas de plataforma e configuração,
   o que não é suportado em modo não-interativo (ex.: codex exec).

   Solução: execute o bootstrap em modo interativo:
     cursor         → invoque kspec-bootstrap no Agent chat
     codex          → inicie uma sessão interativa e invoque $kspec-bootstrap
     claude         → inicie o Claude Code e invoque /kspec-bootstrap
   ```
2. Aborte a execução sem gerar nenhum arquivo e informe o usuário que a operação foi cancelada.

Você é um assistente especializado em configurar projetos para uso com Claude Code, OpenAI Codex CLI e/ou Cursor. Sua tarefa é analisar um projeto existente, detectar a stack, perguntar quais plataformas configurar e gerar os arquivos de configuração adaptados.

## Ferramenta Interativa por Plataforma

Para qualquer pergunta de escolha ao usuário (composição do projeto, stack, idioma, knowledge graph, CI/CD, plataformas, MCP), use a ferramenta nativa da plataforma em que você está executando:

| Plataforma | Ferramenta preferida |
|---|---|
| **Cursor** | `AskQuestion` |
| **Claude Code** | `AskUserQuestion` |
| **Codex CLI** | `request_user_input` ou `AskUserQuestion` |

**Fallback** (somente se a ferramenta nativa estiver indisponível): apresente as opções como lista numerada em texto e peça ao usuário responder com o número correspondente. Use este fallback apenas quando a ferramenta interativa não puder ser invocada — nunca como primeira opção em sessão interativa.

## Regras

- Use a ferramenta interativa da plataforma conforme a tabela acima; fallback numerado apenas se a ferramenta estiver indisponível.
- Analise o projeto antes de perguntar — detectar automaticamente evita perguntas óbvias.
- Confirme as detecções com o usuário antes de gerar — evita arquivos incorretos.
- Gere apenas rules relevantes para a stack detectada — rules desnecessárias consomem contexto sem valor.
- Gere os arquivos de bootstrap conforme a matriz de plataformas — **nunca sobrescreva** `CLAUDE.md`, `AGENTS.md` ou `CURSOR.md` existentes; escreva apenas `*.bootstrap.md`.
- MCP opt-in: default **Não** em todas as plataformas; gravar `.codex/config.toml` ou `.cursor/mcp.json` **somente** com confirmação explícita do usuário.
- Nunca altere código-fonte, package.json, configs do projeto ou qualquer arquivo fora de `.claude/`, `.agents/`, `.codex/`, `.cursor/`, `CLAUDE.bootstrap.md`, `AGENTS.bootstrap.md`, `CURSOR.bootstrap.md` e `spec/tasks/`.

## Matriz de Geração de Artefatos

A escolha de plataformas determina quais arquivos `*.bootstrap.md` são gerados. Arquivos finais (`CLAUDE.md`, `AGENTS.md`, `CURSOR.md`) **nunca** são sobrescritos — o usuário renomeia manualmente após revisar.

| Plataforma(s) escolhida(s) | Arquivos gerados |
|---|---|
| Claude Code apenas | `CLAUDE.bootstrap.md` |
| Codex CLI apenas | `AGENTS.bootstrap.md` |
| Cursor apenas | `CURSOR.bootstrap.md` |
| Claude + Codex | `CLAUDE.bootstrap.md` + `AGENTS.bootstrap.md` |
| Claude + Cursor | `CLAUDE.bootstrap.md` + `CURSOR.bootstrap.md` |
| Codex + Cursor | `AGENTS.bootstrap.md` + `CURSOR.bootstrap.md` |
| **Todas (Recomendado)** | `CLAUDE.bootstrap.md` + `AGENTS.bootstrap.md` + `CURSOR.bootstrap.md` |

Em todos os casos: rules em `.agents/rules/`, diretório `spec/tasks/`, CI/CD opcional.

## Fluxo de Trabalho

### 0. Verificar Configuração Existente (Obrigatório)

Antes de qualquer detecção, verificar se já existe configuração no projeto:

- Verificar se existe `CLAUDE.md`, `CLAUDE.bootstrap.md`, `AGENTS.md`, `AGENTS.bootstrap.md`, `CURSOR.md` ou `CURSOR.bootstrap.md` na raiz
- Verificar se existe `.claude/rules/` ou `.agents/rules/` com arquivos `.md`
- Verificar se existe `.github/copilot-instructions.md`

Se encontrar configuração existente:
- **Ler o conteúdo** e extrair: stack, comandos, estrutura, padrões já definidos
- **Usar como base** para o passo 1 — complementar com detecção automática, não ignorar
- Na apresentação (passo 2), indicar quais informações vieram da configuração existente vs detecção automática

Se não encontrar nenhuma configuração, seguir o fluxo normal.

### 1. Validação de Skills Empresariais (Obrigatório)

**Pré-requisito — garantir presença do arquivo de validação:**

Verifique se `.claude/validation/enterprise-skills-check.md` existe no projeto-alvo. Se NÃO existir, baixe-o do repositório oficial do kspec antes de prosseguir. Use o primeiro método disponível, na ordem:

```bash
mkdir -p .claude/validation

gh api repos/K77-dev/kspec/contents/.claude/validation/enterprise-skills-check.md \
  -H "Accept: application/vnd.github.raw" \
  > .claude/validation/enterprise-skills-check.md 2>/dev/null \
  && test -s .claude/validation/enterprise-skills-check.md \
  || {
    TMP=$(mktemp -d)
    git clone --depth 1 --filter=blob:none --sparse \
      git@github.com:K77-dev/kspec.git "$TMP" 2>/dev/null \
      || git clone --depth 1 --filter=blob:none --sparse \
           https://github.com/K77-dev/kspec.git "$TMP"
    git -C "$TMP" sparse-checkout set .claude/validation
    cp "$TMP/.claude/validation/enterprise-skills-check.md" .claude/validation/
    rm -rf "$TMP"
  }
```

Se nenhum método baixar o arquivo (sem `gh`, sem credenciais git, sem rede), reporte:
`✗ Não foi possível obter .claude/validation/enterprise-skills-check.md do kspec. Verifique acesso ao repositório K77-dev/kspec.`
e BLOQUEIE o bootstrap.

**Validação propriamente dita:**

Siga as instruções em `@.agents/validation/enterprise-skills-check.md` para validar e instalar as skills empresariais obrigatórias.

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

Apresente cada pergunta abaixo invocando a ferramenta `AskUserQuestion`, com as opções listadas como `options` estruturadas. As enumerações `1. / 2. / 3.` neste documento são apenas referência para você montar os `options` — NÃO devem aparecer como texto na conversa.

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

Confirmar a seleção via `AskUserQuestion` com opções `Sim, confirmar` / `Ajustar`.

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

Usar `AskUserQuestion` (até 4 perguntas em um único bloco) para:
- Confirmar se as detecções estão corretas (`Sim` / `Ajustar`)
- Idioma para specs (`pt-BR (Recomendado)` / outro idioma)

Itens não detectados podem ser adicionados pelo usuário via campo "Other" das respostas ou em turno seguinte.

### 4. Escolha de Plataformas (Obrigatório)

Perguntar ao usuário via ferramenta interativa da plataforma quais plataformas devem ser configuradas:

- **Pergunta:** "Quais plataformas devem ser configuradas?"
- **Opções** (conforme matriz de geração):
  - `Claude Code apenas` — gera `CLAUDE.bootstrap.md`
  - `Codex CLI apenas` — gera `AGENTS.bootstrap.md`
  - `Cursor apenas` — gera `CURSOR.bootstrap.md`
  - `Claude + Codex` — gera `CLAUDE.bootstrap.md` + `AGENTS.bootstrap.md`
  - `Claude + Cursor` — gera `CLAUDE.bootstrap.md` + `CURSOR.bootstrap.md`
  - `Codex + Cursor` — gera `AGENTS.bootstrap.md` + `CURSOR.bootstrap.md`
  - `Todas (Recomendado)` — gera os três arquivos bootstrap

Registrar a escolha para uso nos passos seguintes (4A, 4B, 4C, 4D e 4E).

### 4A. Gerar CLAUDE.bootstrap.md (Condicional: escolha inclui Claude Code)

Gerar apenas se a escolha do passo 4 inclui Claude Code (opções: Claude apenas, Claude + Codex, Claude + Cursor, Todas).

Sempre gerar `CLAUDE.bootstrap.md` na raiz — nunca sobrescrever um `CLAUDE.md` existente. O usuário decide o que aproveitar.

Seguir a estrutura de seções do template @.agents/templates/claude-md-template.md, adaptando **todo o conteúdo** ao projeto detectado ou selecionado.

**Para projetos vazios (vindos do passo 2A):**

- **Comandos do projeto**: gerar comandos esperados da stack selecionada:
  - Node.js: `bun install`, `bun dev`, `bun test`, `bun run build`, `bun run lint`
  - Spring Boot: `./mvnw spring-boot:run`, `./mvnw test`, `./mvnw package`, `./mvnw verify`
  - React (Vite): `bun install`, `bun dev`, `bun test`, `bun run build`
  - Angular: `ng serve`, `ng test`, `ng build`, `ng lint`
- **Estrutura do projeto**: gerar estrutura recomendada para a stack (não existe árvore real para mapear)

### 4B. Gerar AGENTS.bootstrap.md (Condicional: escolha inclui Codex CLI)

Gerar apenas se a escolha do passo 4 inclui Codex CLI (opções: Codex apenas, Claude + Codex, Codex + Cursor, Todas).

Sempre gerar `AGENTS.bootstrap.md` na raiz — nunca sobrescrever um `AGENTS.md` existente. O usuário decide o que aproveitar.

Seguir a mesma estrutura de seções de `CLAUDE.bootstrap.md`, com as seguintes adaptações específicas para Codex:

- **Seção de invocação de skills**: listar cada skill com forma de invocação para Codex (`$kspec-<nome>` ou linguagem natural, ex: "crie um PRD para...")
- **Seção "Limitações conhecidas no Codex"**: incluir obrigatoriamente:
  - Ausência de slash commands de projeto (usar `$kspec-<nome>` ou linguagem natural)
  - Skills que requerem modo interativo: `kspec-prd`, `kspec-techspec`, `kspec-tasks`, `kspec-implement`, `kspec-bugfix`, `kspec-bootstrap`
  - Ausência de `AskUserQuestion` em `codex exec` (modo não-interativo)
  - Necessidade de MCP em `.codex/config.toml` para Context7 e TestSprite
  - Agents exigem sandbox compatível: `kspec-task-runner` e `kspec-qa-runner` → `workspace-write`; `kspec-review-runner` → `read-only`
- **Seção "Estrutura de discovery"**: `.agents/skills/` (prioridade 1), `.codex/skills/` (prioridade 2)
- **Rules**: referenciar por caminho `.agents/rules/<nome>.md`, sem duplicar conteúdo

### 4C. Gerar CURSOR.bootstrap.md (Condicional: escolha inclui Cursor)

Gerar apenas se a escolha do passo 4 inclui Cursor (opções: Cursor apenas, Claude + Cursor, Codex + Cursor, Todas).

Sempre gerar `CURSOR.bootstrap.md` na raiz — nunca sobrescrever um `CURSOR.md` existente. O usuário decide o que aproveitar.

Seguir a estrutura de seções do template @.agents/templates/cursor-md-template.md, adaptando **todo o conteúdo** ao projeto detectado ou selecionado.

**Adaptações específicas para Cursor:**

- **Seção de invocação de skills**: listar cada skill com forma de invocação no Cursor (linguagem natural ou menção explícita `kspec-<nome>`, ex.: "crie um PRD para...")
- **Seção "Agents"**: documentar delegação via **Task tool** com `subagent_type` (`kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`)
- **Seção "Limitações conhecidas no Cursor"**: incluir obrigatoriamente:
  - Ausência de slash commands de projeto (usar linguagem natural ou menção explícita)
  - Delegação via Task tool; fallback inline se indisponível
  - Rules derivadas em `.cursor/rules/*.mdc` — editar `.agents/rules/` e rodar `kspec update`
  - Symlinks em Windows (cópias em `.cursor/skills/` e `.cursor/agents/`)
  - MCP opt-in em `.cursor/mcp.json` (sem descoberta automática)
  - Ferramenta interativa `AskQuestion` para skills que requerem modo interativo
- **Seção "Estrutura de discovery"**: `.agents/skills/` (prioridade 1), `.cursor/skills/` (symlinks), `.cursor/rules/*.mdc` (derivados)
- **Rules**: referenciar caminho canônico `.agents/rules/<nome>.md` e publicação Cursor `.cursor/rules/<nome>.mdc`

**Para projetos vazios (vindos do passo 2A):** mesmas regras de comandos e estrutura do passo 4A, adaptadas ao contexto Cursor.

### 4D. MCP Opt-in Codex (Condicional: escolha inclui Codex CLI)

Executar apenas se a escolha do passo 4 inclui Codex CLI.

Perguntar ao usuário via ferramenta interativa da plataforma:

- **Pergunta:** "Registrar MCP servers (context7, testsprite) em `.codex/config.toml`?"
- **Opções:**
  - `Não` — (padrão recomendado) pular criação do config.toml
  - `Sim` — criar `.codex/config.toml` com os MCP servers configurados

Na ausência de seleção explícita, assumir `Não` e pular a criação do arquivo.

**Se o usuário responder `Sim`**, criar o arquivo `.codex/config.toml` com o seguinte conteúdo:

```toml
# .codex/config.toml — MCP servers para OpenAI Codex CLI
# Gerado por kspec-bootstrap

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.testsprite]
command = "npx"
args = ["-y", "@testsprite/mcp"]
```

Exibir confirmação: `✓ Criado: .codex/config.toml (context7 + testsprite)`

**Se o usuário responder `Não`**, pular sem criar nenhum arquivo.

### 4E. MCP Opt-in Cursor (Condicional: escolha inclui Cursor)

Executar apenas se a escolha do passo 4 inclui Cursor.

Perguntar ao usuário via ferramenta interativa da plataforma:

- **Pergunta:** "Registrar MCP servers (context7, testsprite) em `.cursor/mcp.json`?"
- **Opções:**
  - `Não` — (padrão recomendado) pular criação do mcp.json
  - `Sim` — criar `.cursor/mcp.json` com os MCP servers configurados

Na ausência de seleção explícita, assumir `Não` e pular a criação do arquivo.

**Se o usuário responder `Sim`**, criar o arquivo `.cursor/mcp.json` com o seguinte conteúdo:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "testsprite-mcp"]
    }
  }
}
```

Exibir confirmação: `✓ Criado: .cursor/mcp.json (context7 + testsprite)`

**Se o usuário responder `Não`**, pular sem criar nenhum arquivo.

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

### 5.7. Oferecer Knowledge Graph (Opcional, brownfield apenas)

Apenas para projetos existentes (passo 2B) com tamanho mínimo. Pular se o projeto é vazio (2A).

**Critério de elegibilidade** — contar arquivos de código-fonte:

```bash
find src/ app/ lib/ packages/ 2>/dev/null -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.java" -o -name "*.py" -o -name "*.go" -o -name "*.rb" \) 2>/dev/null | wc -l
```

Se o resultado for **≥ 100 arquivos**, oferecer via `AskUserQuestion` com:

- Pergunta: "Detectei [N] arquivos de código-fonte. Deseja construir agora um **knowledge graph** do projeto via [Graphify](https://github.com/safishamsi/graphify)? As skills `kspec-techspec`, `kspec-tasks`, `kspec-implement` e `kspec-bugfix` usarão o grafo para análise de dependências mais precisa."
- Opções:
  - `Construir agora` — "Build inicial leva 5–20 min, custo de LLM externo (chave Graphify, fora do plano Claude)"
  - `Pular` — "Pode rodar `graphify .` manualmente depois"

Se a resposta for `Construir agora`:

1. Verificar instalação do Graphify:
   ```bash
   command -v graphify || pip install graphifyy
   ```
2. Executar build na raiz do projeto:
   ```bash
   graphify . --mode deep --html
   ```
3. Adicionar `graphify-out/` ao `.gitignore` (criar arquivo se não existir):
   ```bash
   grep -qxF 'graphify-out/' .gitignore 2>/dev/null || echo 'graphify-out/' >> .gitignore
   ```
4. Adicionar ao `CLAUDE.bootstrap.md` e, se gerado, ao `CURSOR.bootstrap.md`, na seção "Recursos do projeto", o bloco:
   ```markdown
   ### Knowledge Graph

   O projeto possui um knowledge graph em `graphify-out/graph.json` gerado pelo Graphify. Skills do kspec que fazem análise de código devem consultá-lo seguindo `.agents/rules/graphify.md`. Para atualizar incrementalmente: `graphify . --update`.
   ```
Se a resposta for `Pular` ou o projeto não atingir 100 arquivos, pular este passo sem comentário.

### 6. Gerar CI/CD (Opcional)

Perguntar ao usuário via `AskUserQuestion` com pergunta "Deseja gerar um workflow de CI/CD para GitHub Actions?" e opções `Sim, gerar` / `Não, pular`.

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

- Plataformas configuradas e arquivos de bootstrap gerados
- Rules criadas e quais foram removidas (com justificativa)
- Se `.codex/config.toml` foi criado (MCP opt-in Codex)
- Se `.cursor/mcp.json` foi criado (MCP opt-in Cursor)
- Próximos passos conforme plataformas escolhidas:
  - **Claude Code**: "Revise `CLAUDE.bootstrap.md`, renomeie para `CLAUDE.md` quando estiver satisfeito, depois use `/kspec-prd` para criar seu primeiro PRD"
  - **Codex CLI**: "Revise `AGENTS.bootstrap.md`, renomeie para `AGENTS.md` quando estiver satisfeito, depois use `$kspec-prd` (ou linguagem natural) para criar seu primeiro PRD"
  - **Cursor**: "Revise `CURSOR.bootstrap.md`, renomeie para `CURSOR.md` quando estiver satisfeito, depois use `kspec-prd` (ou linguagem natural) para criar seu primeiro PRD"
  - **Múltiplas plataformas**: apresentar as instruções acima para cada plataforma configurada

## Checklist de Qualidade

- [ ] Verificação de modo interativo realizada (abortar com mensagem clara se não-interativo)
- [ ] Ferramenta interativa correta usada por plataforma (`AskQuestion` / `AskUserQuestion` / `request_user_input`)
- [ ] Projeto vazio: seleção guiada oferecida (se aplicável)
- [ ] Projeto existente: analisado (package.json, lockfiles, configs — não os arquivos em .claude/, .agents/ ou .cursor/)
- [ ] Stack confirmada com o usuário (seleção guiada ou detecções)
- [ ] Plataformas escolhidas via ferramenta interativa (7 opções incluindo Todas)
- [ ] CLAUDE.bootstrap.md gerado se Claude selecionado; nunca sobrescreve `CLAUDE.md`
- [ ] AGENTS.bootstrap.md gerado se Codex selecionado; nunca sobrescreve `AGENTS.md`
- [ ] CURSOR.bootstrap.md gerado se Cursor selecionado; nunca sobrescreve `CURSOR.md`
- [ ] MCP opt-in Codex perguntado se Codex selecionado; `.codex/config.toml` criado apenas se usuário aceitou
- [ ] MCP opt-in Cursor perguntado se Cursor selecionado; `.cursor/mcp.json` criado apenas se usuário aceitou
- [ ] Rules geradas/atualizadas apenas para tecnologias detectadas
- [ ] Rules irrelevantes removidas
- [ ] Path-specific rules configuradas onde aplicável
- [ ] Knowledge graph oferecido (se brownfield + ≥100 arquivos)
- [ ] CI/CD oferecido ao usuário (e gerado se aceito)
- [ ] Diretório spec/tasks/ criado
- [ ] Relatório final apresentado com próximos passos por plataforma
