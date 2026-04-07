---
name: kspec-sync
description: Sincroniza os diretórios .claude/, .gemini/ e .github/ a partir do .agents/ (source of truth). Adapta referências, placeholders e formatos por plataforma.
---

Sincroniza as configurações de todas as plataformas a partir do `.agents/` como fonte de verdade. Garante paridade entre os 4 diretórios de configuração.

## Importante

- **Source of truth**: `.agents/` — todas as mudanças devem ser feitas aqui primeiro
- **Destinos**: `.claude/`, `.gemini/`, `.github/`
- Esta skill é para **manutenção do próprio kspec**, não para projetos que usam kspec

## Fluxo de Trabalho

### 1. Análise do Source of Truth (Obrigatório)

Ler a estrutura completa de `.agents/`:
- Listar todos os arquivos em `skills/`, `agents/`, `rules/`, `templates/`, `validation/`
- Mapear o inventário atual

### 2. Comparar com Destinos (Obrigatório)

Para cada destino (`.claude/`, `.gemini/`, `.github/`), verificar:
- Arquivos presentes no source que faltam no destino
- Arquivos no destino que não existem no source (podem ser específicos da plataforma)
- Arquivos com conteúdo divergente

Apresentar relatório de diferenças ao usuário antes de sincronizar.

### 3. Sincronizar .claude/ (Obrigatório)

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

### 4. Sincronizar .gemini/ (Obrigatório)

Copiar de `.agents/` para `.gemini/`, adaptando:

| De (.agents/) | Para (.gemini/) |
|---|---|
| `@.agents/` | `@./.gemini/` |
| `<SLUG>` | `<SLUG>` (em agents e skills que recebem slug) |
| `AGENTS.md` | `GEMINI.md` |
| `AGENTS.bootstrap.md` | `GEMINI.bootstrap.md` |
| `agents-md-template.md` | `gemini-md-template.md` |
| `Agents` (nome genérico) | `Gemini CLI` |
| `.agents/` (paths) | `.gemini/` |
| Agents em subdiretórios | Agents como arquivos flat (`.gemini/agents/nome.md`) |

Diferenças estruturais do Gemini:
- Agents são arquivos flat (não subdiretórios)
- Referências usam `@./` antes do path
- Placeholders usam `<SLUG>` em vez de `$ARGUMENTS`

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
- [ ] Mesmo número de skills em todos os 4 diretórios
- [ ] Mesmo número de agents em todos os 4 diretórios
- [ ] Mesmo número de rules em todos os 4 diretórios
- [ ] Mesmo número de templates em todos os 4 diretórios
- [ ] Nenhuma referência a `.claude` dentro de `.gemini/` ou `.github/` (e vice-versa)
- [ ] Nenhuma referência a `CLAUDE` dentro de `.agents/`

### 7. Reportar Resultados

- Arquivos criados/atualizados por destino
- Arquivos ignorados (específicos de plataforma)
- Alertas de divergências não resolvidas

## Checklist de Qualidade

- [ ] .agents/ analisado como source of truth
- [ ] Diferenças identificadas e apresentadas ao usuário
- [ ] .claude/ sincronizado com referências adaptadas
- [ ] .gemini/ sincronizado com placeholders e estrutura adaptados
- [ ] .github/ sincronizado com formato .prompt.md/.instructions.md
- [ ] Paridade validada entre os 4 diretórios
- [ ] Nenhuma referência cruzada entre plataformas
