# Instruções do Projeto

Guia para o Copilot ao trabalhar com o código deste repositório.

[Breve descrição do projeto baseada no package.json]

### Idioma

- **Código-fonte**: inglês (variáveis, funções, classes, comentários)
- **Specs e documentação de projeto** (PRD, tech spec, tasks, reviews): [idioma escolhido pelo usuário]

### Prioridades

[Lista de prioridades baseadas na stack detectada. Exemplos:
- **Sempre use [package manager detectado]** — nunca use [alternativas]
- **Nunca use [framework errado]** — o backend usa [framework correto]
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

### Stack

| Área              | Tecnologia                          |
| ----------------- | ----------------------------------- |
| [área]            | [tecnologia detectada]              |

### Estrutura do projeto

[Árvore de diretórios real do projeto com descrições]

```
/
├── [diretório]/
│   └── [arquivo]       # [descrição]
```

### [Framework principal]

[Resumo breve com ponteiro para instruction — ex: "Componentes funcionais, props tipadas — detalhes em `.github/instructions/react.instructions.md`"]

### Testes

[Resumo breve com ponteiro para instruction — ex: "Unit: Vitest | E2E: Playwright — detalhes em `.github/instructions/tests.instructions.md`"]

### Git

- **Não execute** `git restore`, `git reset`, `git clean` ou comandos destrutivos **sem permissão explícita do usuário**

### Anti-padrões

[Lista baseada na stack real. Exemplos:
1. Usar [package manager errado] em vez de [correto]
2. Referenciar [framework errado] — o backend usa [framework correto]
3. Esquecer verificação antes de marcar tarefa concluída
4. Executar comandos git destrutivos sem permissão do usuário]
