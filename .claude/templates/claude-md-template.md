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

[Resumo breve com ponteiro para rule — ex: "Unit: Vitest | E2E: Playwright — detalhes em `.claude/rules/tests.md`"]

### Git

- **Não execute** `git restore`, `git reset`, `git clean` ou comandos destrutivos **sem permissão explícita do usuário**

### Anti-padrões

[Lista baseada na stack real. Exemplos:
1. Pular ativação de skill
2. Usar [package manager errado] em vez de [correto]
3. Referenciar [framework errado] — o backend usa [framework correto]
4. Esquecer verificação antes de marcar tarefa concluída
5. Executar comandos git destrutivos sem permissão do usuário]
