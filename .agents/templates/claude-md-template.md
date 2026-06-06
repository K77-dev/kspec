# CLAUDE.md

Guia para agentes de IA ao trabalhar com o código deste repositório.

[Breve descrição do projeto baseada no package.json]

### Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação de projeto** (PRD, tech spec, tasks, reviews): [idioma escolhido pelo usuário]

### Prioridades

[Lista de prioridades baseadas na stack detectada. Exemplos:
- **Sempre use [package manager detectado]** — nunca use [alternativas]
- **Sempre ative a skill `[framework]`** ao trabalhar no [área] — nunca use [alternativa]
- **Execute os checks** antes de concluir: [comandos reais do projeto]
- **Não use workarounds** — prefira correções de causa raiz]

### Comandos do projeto

[Extrair dos scripts reais do package.json (raiz e workspaces)]

```bash
# Raiz
[comando]              # [descrição]

# [Workspace 1]
[comando]              # [descrição]

# [Workspace 2]
[comando]              # [descrição]
```

### Stack e skills recomendadas

| Área              | Tecnologia                          | Skill sugerida                                                        |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------- |
| [área]            | [tecnologia detectada]              | [skill relevante]                                                     |

### Estrutura do projeto

[Árvore de diretórios real do projeto com descrições]

```
/
├── [diretório]/
│   └── [arquivo]       # [descrição]
```

### [Framework principal]

[Resumo breve com ponteiro para rule — ex: "Componentes funcionais, props tipadas — detalhes em `.claude/rules/react.md`"]

### Testes

[Resumo breve com ponteiro para rule — ex: "Unit: Vitest | E2E: TestSprite — detalhes em `.claude/rules/tests.md`"]

### Rules — Padrões de Código

Rules core do kspec são **obrigatórias** e vêm com a instalação. Consulte-as em `.agents/rules/` (source of truth) ou `.claude/rules/` (discovery).

| Rule | Escopo | Verificar em |
| --- | --- | --- |
| `code-standards.md` | **Clean Code, SOLID, limites mensuráveis** — rule core obrigatória, sempre aplicável | Todos os arquivos no escopo de implementação e review |
| `database.md` | ORM, queries, migrations | [paths detectados — ex.: `src/**/*db*`, `src/**/*repo*`] |
| `logging.md` | Níveis e estrutura de log | [paths detectados — ex.: `src/**/*log*`, `src/**/*service*`] |
| [rules de stack] | [escopo da rule enterprise] | [paths ajustados no bootstrap] |

**`code-standards.md` é inegociável** — não remova em projetos brownfield. No Cursor, a rule equivalente (`.cursor/rules/code-standards.mdc`) usa `alwaysApply: true`. Apenas convenções de estilo em rules enterprise são adaptáveis no bootstrap; princípios universais de Clean Code e SOLID permanecem intactos.

### Git

- **Não execute** `git restore`, `git reset`, `git clean` ou comandos destrutivos **sem permissão explícita do usuário**

### Anti-padrões

[Lista baseada na stack real. Exemplos:
1. Pular ativação de skill
2. Usar [package manager errado] em vez de [correto]
3. Referenciar [framework errado] — o backend usa [framework correto]
4. Esquecer verificação antes de marcar tarefa concluída
5. Executar comandos git destrutivos sem permissão do usuário]
