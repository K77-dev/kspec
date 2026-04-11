---
description: Sincroniza os diretórios .claude/ e .github/ a partir do .agents/ (source of truth). Adapta referências, placeholders e formatos por plataforma.
agent: agent
---

Sincroniza as configurações de todas as plataformas a partir do `.agents/` como fonte de verdade. Garante paridade entre os 3 diretórios de configuração.

## Importante

- **Source of truth**: `.agents/` — todas as mudanças devem ser feitas aqui primeiro
- **Destinos**: `.claude/`, `.github/`
- Esta skill é para **manutenção do próprio kspec**, não para projetos que usam kspec

## Fluxo de Trabalho

### 1. Análise do Source of Truth

Ler a estrutura completa de `.agents/`:
- Listar todos os arquivos em `skills/`, `agents/`, `rules/`, `templates/`, `validation/`
- Mapear o inventário atual

### 2. Comparar com Destinos

Para cada destino (`.claude/`, `.github/`), verificar:
- Arquivos presentes no source que faltam no destino
- Arquivos no destino que não existem no source (podem ser específicos da plataforma)
- Arquivos com conteúdo divergente

Apresentar relatório de diferenças ao usuário antes de sincronizar.

### 3. Sincronizar .claude/

Copiar de `.agents/` para `.claude/`, adaptando:

| De (.agents/) | Para (.claude/) |
|---|---|
| `@.agents/` | `@.claude/` |
| `AGENTS.md` | `CLAUDE.md` |
| `AGENTS.bootstrap.md` | `CLAUDE.bootstrap.md` |
| `agents-md-template.md` | `claude-md-template.md` |
| `Agents` (nome genérico) | `Claude Code` |
| `.agents/` (paths) | `.claude/` |

### 4. Sincronizar .github/

Copiar de `.agents/` para `.github/`, adaptando:

| De (.agents/) | Para (.github/) |
|---|---|
| `skills/nome/SKILL.md` | `prompts/nome.prompt.md` |
| `agents/nome/AGENT.md` | `prompts/nome.prompt.md` |
| `rules/nome.md` | `instructions/nome.instructions.md` |
| `templates/` | `templates/` (mantém) |
| `agents-md-template.md` | `copilot-instructions-template.md` |
| `AGENTS.md` | `copilot-instructions.md` |

### 5. Validar Paridade

Após sincronizar, verificar:
- Mesmo número de skills em todos os 3 diretórios
- Mesmo número de agents em todos os 3 diretórios
- Mesmo número de rules em todos os 3 diretórios
- Mesmo número de templates em todos os 3 diretórios
- Nenhuma referência cruzada entre plataformas

### 6. Reportar Resultados

- Arquivos criados/atualizados por destino
- Arquivos ignorados (específicos de plataforma)
- Alertas de divergências não resolvidas
