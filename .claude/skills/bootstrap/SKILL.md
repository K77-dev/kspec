---
name: bootstrap
description: Analisa um projeto existente e gera a configuração completa do Claude Code (.claude/, CLAUDE.md) adaptada à stack, estrutura e convenções detectadas.
---

Você é um assistente especializado em configurar projetos para uso com Claude Code. Sua tarefa é analisar um projeto existente, detectar a stack e gerar os arquivos de configuração adaptados.

## Regras

- Analise o projeto antes de perguntar — detectar automaticamente evita perguntas óbvias.
- Confirme as detecções com o usuário antes de gerar — evita arquivos incorretos.
- Gere apenas rules relevantes para a stack detectada — rules desnecessárias consomem contexto sem valor.
- Não sobrescreva arquivos existentes sem permissão — o projeto pode já ter configuração parcial.

## Fluxo de Trabalho

### 1. Análise do Projeto (Obrigatório)

Detectar automaticamente:

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
- Testes: Vitest, Jest, Playwright, Cypress, etc.
- Validação: Zod, Yup, Joi, etc.

**Estrutura** — mapear diretórios e entry points:
- Monorepo (workspaces) vs single-package
- Diretórios de código-fonte (src/, app/, lib/, etc.)
- Diretórios de testes
- Diretórios de config

**Scripts** — ler scripts do `package.json`:
- dev, build, test, lint, typecheck, etc.

**Configs existentes** — verificar se já existe `.claude/`, `CLAUDE.md`, etc.

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

### 3. Gerar CLAUDE.bootstrap.md (Obrigatório)

Criar `CLAUDE.bootstrap.md` na raiz — nunca sobrescrever um `CLAUDE.md` existente. O usuário decide o que aproveitar.

Seguir a mesma estrutura de seções do CLAUDE.md de referência (@CLAUDE.md), adaptando o conteúdo ao projeto detectado:

- Descrição do projeto (baseada no `package.json`)
- Idioma (código vs specs)
- Prioridades (baseadas na stack detectada)
- Comandos do projeto (extraídos dos scripts)
- Stack e skills recomendadas (tabela)
- Estrutura do projeto (árvore de diretórios)
- React / Testes (resumo com ponteiro para rules)
- Git (restrições de segurança)
- Anti-padrões (baseados na stack — ex: "nunca use Express" se usa Hono)

### 4. Gerar Rules (Obrigatório)

Gerar apenas as rules relevantes para a stack em `.claude/rules/`:

| Condição | Rule gerada |
|---|---|
| Sempre | `code-standards.md` (nomenclatura, formatação) |
| TypeScript detectado | `typescript.md` (tipagem, imports, async/await) |
| Framework HTTP detectado | `http.md` (adaptado ao framework: Hono, Express, Fastify) |
| React/Vue/Svelte detectado | `[framework].md` (padrões de componentes) |
| Vitest/Jest detectado | `tests.md` (adaptado ao test runner) |
| Logging configurado | `logging.md` (níveis, estrutura) |

Cada rule deve:
- Usar `paths:` no frontmatter quando aplicável
- Conter exemplos com a stack real do projeto (não genéricos)

### 5. Copiar Skills, Agents e Templates (Obrigatório)

Copiar de @.claude/ para o projeto:
- `skills/` — prd, techspec, tasks, implement, bugfix
- `agents/` — review, qa
- `templates/` — prd-template, techspec-template, tasks-template, task-template

Ajustar referências internas se a estrutura de saída for diferente.

### 6. Criar Diretório de Artefatos (Obrigatório)

- Criar `spec/tasks/` para os artefatos gerados

### 7. Relatório Final

Apresentar ao usuário:

- Lista de arquivos gerados
- Resumo das rules criadas (e quais foram omitidas, com justificativa)
- Próximos passos recomendados (ex: "Ajuste o CLAUDE.md se necessário, depois use /prd para criar seu primeiro PRD")

## Checklist de Qualidade

- [ ] Projeto analisado (package.json, lockfiles, configs)
- [ ] Detecções confirmadas com o usuário
- [ ] CLAUDE.bootstrap.md gerado e adaptado à stack
- [ ] Rules geradas apenas para tecnologias detectadas
- [ ] Path-specific rules configuradas onde aplicável
- [ ] Skills, agents e templates copiados
- [ ] Diretório spec/tasks/ criado
- [ ] Relatório final apresentado
