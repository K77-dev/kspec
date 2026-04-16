---
name: kspec-sync
version: 1.0.0
description: Sincroniza os diretórios .claude/ e .github/ a partir do .agents/ (source of truth). Adapta referências, placeholders e formatos por plataforma.
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-sync**

Sincroniza as configurações de todas as plataformas a partir do `.agents/` como fonte de verdade. Garante paridade entre os 3 diretórios de configuração.

## Importante

- **Source of truth**: `.agents/` — todas as mudanças devem ser feitas aqui primeiro
- **Destinos**: `.claude/`, `.github/`
- Esta skill é para **manutenção do próprio kspec**, não para projetos que usam kspec

## Fluxo de Trabalho

### 1. Propagação de Versão (Obrigatório)

Ler o arquivo `VERSION` na raiz do repositório kspec. Atualizar o campo `version:` no frontmatter de todos os arquivos:
- `.agents/skills/*/SKILL.md`
- `.agents/agents/*/AGENT.md`

Se o `version:` no frontmatter divergir do `VERSION`, corrigir antes de prosseguir com a sincronização.

### 2. Análise do Source of Truth (Obrigatório)

Ler a estrutura completa de `.agents/`:
- Listar todos os arquivos em `skills/`, `agents/`, `rules/`, `templates/`, `validation/`
- Mapear o inventário atual

### 3. Comparar com Destinos (Obrigatório)

Para cada destino (`.claude/`, `.github/`), verificar:
- Arquivos presentes no source que faltam no destino
- Arquivos no destino que não existem no source (podem ser específicos da plataforma)
- Arquivos com conteúdo divergente

Apresentar relatório de diferenças ao usuário antes de sincronizar.

### 4. Sincronizar .claude/ (Obrigatório)

Copiar de `.agents/` para `.claude/`, adaptando:

| De (.agents/) | Para (.claude/) |
|---|---|
| `@.agents/` | `@.claude/` |
| `AGENTS.md` | `CLAUDE.md` |
| `AGENTS.bootstrap.md` | `CLAUDE.bootstrap.md` |
| `agents-md-template.md` | `claude-md-template.md` |
| `Agents` (nome genérico) | `Claude Code` |
| `.agents/` (paths) | `.claude/` |

Manter a estrutura de subdiretórios para agents: `.claude/agents/nome/AGENT.md`

### 5. Sincronizar .github/ (Obrigatório)

Copiar de `.agents/` para `.github/`, adaptando:

| De (.agents/) | Para (.github/) |
|---|---|
| `skills/nome/SKILL.md` | `prompts/nome.prompt.md` |
| `agents/nome/AGENT.md` | `prompts/nome.prompt.md` |
| `rules/nome.md` | `instructions/nome.instructions.md` |
| `templates/` | `templates/` (mantém) |
| frontmatter `paths:` | frontmatter `applyTo:` (comma-separated) |
| `agents-md-template.md` | `copilot-instructions-template.md` |
| Step 0 validation | Remover (Copilot não suporta) |
| `AGENTS.md` | `copilot-instructions.md` |

Diferenças estruturais do GitHub Copilot:
- Skills e agents viram `.prompt.md` com frontmatter `description` + `agent: agent`
- Rules viram `.instructions.md` com frontmatter `applyTo`
- Sem step 0 de validação de enterprise skills
- Sem subdiretórios para skills/agents

### 6. Validar Paridade (Obrigatório)

Após sincronizar, verificar:
- [ ] Mesmo número de skills em todos os 3 diretórios
- [ ] Mesmo número de agents em todos os 3 diretórios
- [ ] Mesmo número de rules em todos os 3 diretórios
- [ ] Mesmo número de templates em todos os 3 diretórios
- [ ] Nenhuma referência a `.claude` dentro de `.github/` (e vice-versa)
- [ ] Nenhuma referência a `CLAUDE` dentro de `.agents/`

### 7. Reportar Resultados

- Arquivos criados/atualizados por destino
- Arquivos ignorados (específicos de plataforma)
- Alertas de divergências não resolvidas

## Checklist de Qualidade

- [ ] .agents/ analisado como source of truth
- [ ] Diferenças identificadas e apresentadas ao usuário
- [ ] .claude/ sincronizado com referências adaptadas
- [ ] .github/ sincronizado com formato .prompt.md/.instructions.md
- [ ] Paridade validada entre os 3 diretórios
- [ ] Nenhuma referência cruzada entre plataformas
