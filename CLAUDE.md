# CLAUDE.md

Guia para agentes de IA ao trabalhar com o código deste repositório.

Este projeto é o **kspec** — um kit de especificações e padrões para projetos desenvolvidos com agentes de IA. Contém skills, agents, rules e templates para Claude Code e OpenAI Codex CLI. **Não contém código de aplicação executável.**

### Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação de projeto** (PRD, tech spec, tasks, reviews): português (Brasil)

### Prioridades

- **`.agents/` é o source of truth** — todas as mudanças em skills, agents, rules e templates devem ser feitas em `.agents/` primeiro
- **Sempre verifique as skills** antes de implementar — tarefas sem skills relevantes podem ser invalidadas
- **Não use workarounds** — prefira correções de causa raiz
- **Mantenha paridade** entre os diretórios de plataforma (`.agents/`, `.claude/`, `.codex/`) — `.agents/` é source of truth; `.claude/` e `.codex/` são camadas de discovery via symlinks

### Estrutura do projeto

```
/                                # Raiz do kspec
├── .agents/                     # Skills, agents, rules, templates (source of truth)
│   ├── skills/                  # Skills invocáveis
│   ├── agents/                  # Agents para automação
│   ├── rules/                   # Padrões por tecnologia
│   └── templates/               # Templates para artefatos
├── .claude/                     # Espelhos de .agents/ (symlinks) — discovery para Claude Code
│   ├── skills/                  # → .agents/skills/
│   ├── agents/                  # → .agents/agents/
│   ├── rules/                   # → .agents/rules/
│   ├── templates/               # → .agents/templates/
│   └── validation/              # Validações de skills empresariais
├── .codex/                      # Espelhos de .agents/ (symlinks) — discovery para OpenAI Codex CLI
│   ├── skills/                  # → .agents/skills/
│   └── agents/                  # Agents no formato TOML para Codex CLI
├── .github/                     # GitHub Actions, instructions
├── AGENTS.md                    # Guia para OpenAI Codex CLI (equivalente ao CLAUDE.md)
├── spec/
│   └── tasks/                   # Artefatos gerados (PRDs, techspecs, tasks, reviews)
├── src/                         # Código-fonte principal
├── dist/                        # Build output
├── CLAUDE.md                    # Este arquivo — guia para Claude Code
├── CLAUDE.bootstrap.md          # Configuração auto-gerada (atualize CLAUDE.md com este conteúdo)
├── README.md                    # Documentação pública do projeto
├── VERSION                      # Versão do kspec
├── enterprise-skills-lock.json  # Lock de skills empresariais
├── package.json                 # Dependências Node.js
├── tsconfig.json                # Configuração TypeScript
├── tsup.config.ts               # Configuração tsup (bundler)
└── .gitignore                   # Arquivos ignorados pelo git
```

### Comandos do projeto

```bash
npm install                    # Instalar dependências
npm run dev                    # Watch mode durante desenvolvimento
npm run build                  # Build da distribuição
npm run prepublishOnly         # Pre-publish hook (roda automaticamente antes de npm publish)
npm test                       # Executar testes
npm run test:watch             # Watch mode para testes
```

### Stack e tecnologias

| Camada         | Tecnologia                        | Descrição                              |
| -------------- | --------------------------------- | -------------------------------------- |
| **Linguagem**  | TypeScript 5.6+                   | Tipagem estática, targets ES2022       |
| **Runtime**    | Node.js >= 18                     | Execução de CLI e scripts              |
| **Build**      | tsup 8.3+                         | Bundler TypeScript otimizado           |
| **Package Mgr**| npm                               | Gerenciador de dependências            |
| **Publishing** | npm registry (@k77-dev/kspec)     | Pacote público do kspec                |
| **CLI**        | commander 12.1+, chalk 5.3+       | CLI args parsing e output colorido     |
| **Utils**      | fs-extra 11.2+                    | Utilitários de filesystem              |

### Recursos do projeto

#### Skills Disponíveis (Invocáveis)

| Skill | Função |
| --- | --- |
| `kspec-ideia` | Brainstorm/discovery para decompor ideia em módulos |
| `kspec-prd` | Cria PRD a partir de solicitação de funcionalidade |
| `kspec-techspec` | Traduz PRD em especificação técnica |
| `kspec-tasks` | Quebra Tech Spec em tarefas incrementais |
| `kspec-implement` | Executa todas as tasks pendentes |
| `kspec-qa` | Quality Assurance (E2E, acessibilidade) |
| `kspec-pr-review` | Alinhamento semântico spec × implementação e corpo do PR (template oficial) |
| `kspec-bugfix` | Corrige bugs documentados pelo QA |
| `kspec-bootstrap` | Gera configuração para projeto existente |
| `kspec-version` | Exibe versão atual e lista skills/agents |

#### Agents (Acionados por Skills)

| Agent | Acionado por | Função |
| --- | --- | --- |
| `kspec-task-runner` | `/kspec-implement` | Implementa uma task em contexto isolado |
| `kspec-review-runner` | `/kspec-implement` | Code review contra spec e rules |
| `kspec-qa-runner` | `/kspec-qa` | Testa E2E, acessibilidade, visual |

### Rules — Padrões de Código

| Rule | Escopo | Verificar em |
| --- | --- | --- |
| `code-standards.md` | Nomenclatura, formatação, SOLID | Todos os arquivos `.ts`, `.tsx` |
| `database.md` | ORM, queries, migrations | `src/**/*db*`, `src/**/*repo*` |
| `logging.md` | Níveis e estrutura | `src/**/*log*`, `src/**/*service*` |
| `graphify.md` | Knowledge graph (skills análise) | `.agents/`, se `graphify-out/graph.json` existe |

### Git

- **Não execute** `git restore`, `git reset`, `git clean` ou comandos destrutivos **sem permissão explícita do usuário**
- **Prioridade de repositórios**:
  - `.agents/` é o source of truth
  - Mudanças em `.claude/` ou `.codex/` devem estar refletidas em `.agents/` primeiro
  - Symlinks garantem paridade entre plataformas

### Validação de Skills Empresariais

Antes de qualquer operação:

1. Executa o script em `.claude/validation/enterprise-skills-check.md`
2. Valida contra `enterprise-skills-lock.json`
3. Faz sync com repositório remoto (se acessível)
4. Instala ou atualiza skills/rules/templates conforme necessário

Sem essa validação, habilidades obrigatórias podem estar faltando.

### Anti-padrões

1. **Pular ativação de skill** — sempre invocar `/skill-name` quando a task pedir
2. **Usar a branch errada** — `.agents/` é source of truth, não `.claude/`
3. **Executar comandos git destrutivos sem permissão**
4. **Não validar skills** — sempre rodar enterprise-skills-check.md antes de iniciar
5. **Criar regras genéricas** — rules devem ser específicas à tecnologia detectada

### Próximos Passos

1. **Revise este arquivo** (`CLAUDE.bootstrap.md`) com as detecções automáticas
2. **Renomeie para `CLAUDE.md`** quando estiver satisfeito (sobrescreverá o anterior)
3. **Use `/kspec-prd`** para criar seu primeiro PRD
4. **Use `/kspec-techspec`** para traduzir PRD em especificação técnica
5. **Use `/kspec-tasks`** para quebrar a techspec em tarefas
6. **Use `/kspec-implement`** para executar todas as tasks pendentes
