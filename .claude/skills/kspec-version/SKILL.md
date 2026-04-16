---
name: kspec-version
version: 1.0.0
description: Exibe a versão atual do kspec e lista todas as skills e agents disponíveis.
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-version**

Exibe a versão atual do kspec instalada no projeto.

## Fluxo de Trabalho

### 1. Ler Versão (Obrigatório)

Ler o arquivo `VERSION` na raiz do repositório.

### 2. Listar Skills e Agents (Obrigatório)

Listar todos os arquivos `SKILL.md` em `.claude/skills/*/` e `AGENT.md` em `.claude/agents/*/`, extraindo `name`, `version` e `description` do frontmatter de cada um.

### 3. Exibir Resultado (Obrigatório)

Apresentar ao usuário no formato:

```
kspec v{versão}

Skills:
  {name} v{version} — {description}
  ...

Agents:
  {name} v{version} — {description}
  ...
```

Se algum arquivo tiver `version` diferente do `VERSION`, sinalizar com ⚠️ ao lado.
