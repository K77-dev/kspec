# Instruções do Projeto

**kspec** — kit de especificações e padrões para projetos desenvolvidos com agentes de IA. Contém skills, agents, rules e templates para Claude Code, Gemini CLI, GitHub Copilot e Agents (genérico). **Não contém código de aplicação executável.**

## Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação** (PRD, tech spec, tasks, reviews): português (Brasil)

## Regras fundamentais

- **`.agents/` é o source of truth** — todas as mudanças devem ser feitas aqui primeiro
- Não use workarounds — prefira correções de causa raiz
- Não execute `git restore`, `git reset`, `git clean` ou comandos destrutivos sem permissão explícita
- Mantenha paridade entre os 4 diretórios de plataforma (`.agents/`, `.claude/`, `.gemini/`, `.github/`)

## Estrutura

```
/                                # Raiz do kspec
├── .agents/                     # Configuração genérica (SOURCE OF TRUTH)
│   ├── skills/                  # Skills invocáveis
│   ├── agents/                  # Agents (tarefas isoladas)
│   ├── rules/                   # Padrões de código por domínio
│   ├── templates/               # Templates usados pelas skills
│   └── validation/              # Validações de skills empresariais
├── .claude/                     # Configuração Claude Code
├── .gemini/                     # Configuração Gemini CLI
├── .github/                     # Configuração GitHub Copilot
├── spec/tasks/                  # Artefatos gerados (PRDs, techspecs, tasks, reviews)
├── CLAUDE.md                    # Guia para Claude Code
├── AGENTS.md                    # Guia para Agents (genérico)
├── GEMINI.md                    # Guia para Gemini CLI
└── enterprise-skills-lock.json  # Lock de skills empresariais
```

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

- `.agents/` é o source of truth — sincronize com `/kspec-sync` após mudanças
- Rastreabilidade completa: PRD → Tech Spec → Tasks → Review → QA → Bugfix
- Paridade entre as 4 plataformas de agentes
