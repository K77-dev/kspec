# AGENTS.md

Guia para agentes de IA ao trabalhar com o código deste repositório.

Este projeto é o **kspec** — um kit de especificações e padrões para projetos desenvolvidos com agentes de IA. Contém skills, agents, rules e templates para Claude Code, GitHub Copilot e Agents (genérico). **Não contém código de aplicação executável.**

### Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação de projeto** (PRD, tech spec, tasks, reviews): português (Brasil)

### Prioridades

- **`.agents/` é o source of truth** — todas as mudanças em skills, agents, rules e templates devem ser feitas em `.agents/` primeiro, depois sincronizadas via `/kspec-sync`
- **Sempre verifique as skills** antes de implementar — tarefas sem skills relevantes podem ser invalidadas
- **Não use workarounds** — prefira correções de causa raiz
- **Mantenha paridade** entre os 3 diretórios de plataforma (`.agents/`, `.claude/`, `.github/`)

### Estrutura do projeto

```
/                                # Raiz do kspec
├── .agents/                     # Configuração genérica (SOURCE OF TRUTH)
│   ├── skills/                  # Skills invocáveis (cada uma em sua pasta)
│   ├── agents/                  # Agents (executam tarefas isoladas)
│   ├── rules/                   # Padrões de código por domínio
│   ├── templates/               # Templates usados pelas skills
│   └── validation/              # Validações de skills empresariais
├── .claude/                     # Configuração Claude Code (sincronizado de .agents/)
├── .github/                     # Configuração GitHub Copilot (sincronizado de .agents/)
├── spec/
│   └── tasks/                   # Artefatos gerados (PRDs, techspecs, tasks, reviews)
├── CLAUDE.md                    # Guia para Claude Code
├── AGENTS.md                    # Este arquivo — guia para Agents (genérico)
├── README.md                    # Documentação pública do projeto
└── enterprise-skills-lock.json  # Lock de skills empresariais (versionamento)
```

### Skills do kspec

| Skill | Função |
| --- | --- |
| `kspec-ideia` | Brainstorm/discovery para decompor ideia em módulos |
| `kspec-prd` | Cria PRD a partir de solicitação de funcionalidade |
| `kspec-techspec` | Traduz PRD em especificação técnica |
| `kspec-tasks` | Quebra Tech Spec em tarefas incrementais |
| `kspec-implement-task` | Implementa próxima tarefa disponível |
| `kspec-implement-all-tasks` | Executa todas as tasks pendentes |
| `kspec-qa` | Quality Assurance (E2E, acessibilidade) |
| `kspec-bugfix` | Corrige bugs documentados pelo QA |
| `kspec-bootstrap` | Gera configuração para projeto existente |
| `kspec-apidoc` | Gera documentação OpenAPI 3.1 |
| `kspec-adr` | Gera Architecture Decision Records |
| `kspec-release` | Gera changelog e notas de release |
| `kspec-migrate` | Planeja e executa upgrades de dependências |
| `kspec-sync` | Sincroniza plataformas a partir do `.agents/` |

### Agents do kspec

| Agent | Acionado por | Função |
| --- | --- | --- |
| `kspec-task-runner` | `/kspec-implement-task`, `/kspec-implement-all-tasks` | Implementa uma task em contexto isolado |
| `kspec-review-runner` | `/kspec-implement-task`, `/kspec-implement-all-tasks` | Code review contra spec e rules |
| `kspec-qa-runner` | `/kspec-qa` | Testa E2E, acessibilidade, visual |

### Rules

| Rule | Escopo |
| --- | --- |
| `code-standards.md` | Padrões gerais de código |
| `database.md` | Padrões de banco de dados |
| `logging.md` | Padrões de logging |

### Git

- **Não execute** `git restore`, `git reset`, `git clean` ou comandos destrutivos **sem permissão explícita do usuário**

### Anti-padrões

1. Editar diretamente em `.claude/` ou `.github/` sem atualizar `.agents/` primeiro
2. Pular ativação de skill
3. Esquecer verificação de paridade após mudanças
4. Executar comandos git destrutivos sem permissão do usuário
5. Evite fazer workarounds
