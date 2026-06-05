# Relatório de Code Review - Task 7.0: Bootstrap tri-plataforma (skill `kspec-bootstrap`)

## Resumo
- Data: 2026-06-05
- Branch: `002-prd-cursor-support`
- Status: **APROVADO COM RESSALVAS**
- Arquivos Modificados (escopo task 7.0): 2 (`.agents/skills/kspec-bootstrap/SKILL.md`, `tests/bootstrap-triplatform.spec.ts`)
- Linhas Adicionadas: ~278 (`SKILL.md` +122/-35; `bootstrap-triplatform.spec.ts` +156 novo)
- Linhas Removidas: 35 (`SKILL.md`)

> **Nota de escopo:** o working tree contém mudanças de outras tasks (install, migration, distribution, etc.). Este review avalia exclusivamente a extensão tri-plataforma da skill `kspec-bootstrap` e seus testes de integração estáticos.

## Validação de Skills Empresariais
- Arquivo `.agents/validation/enterprise-skills-check.md` existe, porém contém apenas 1 linha (`# Validation`; mínimo exigido: 100).
- **Impacto:** validação empresarial bloqueada no fluxo padrão do review-runner; problema **pré-existente** no repositório kspec, não introduzido pela task 7.0.
- **Ação recomendada:** restaurar o conteúdo completo do arquivo de validação antes do release 1.3.0.

## Conformidade com Rules
| Rule | Status | Observações |
|------|--------|-------------|
| `code-standards.md` | OK | Instruções claras, seções bem delimitadas, matriz tabular legível; sem código TypeScript nesta task. |
| `logging.md` | OK | Mensagens pt-BR com `✓`/`✗`; aborto não-interativo com causa + próxima ação por plataforma (`cursor`/`codex`/`claude`). |
| `database.md` | N/A | Sem persistência. |
| `graphify.md` | N/A | Referência corrigida para `.agents/rules/graphify.md` no bloco de Knowledge Graph. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Matriz de geração cobrindo 3 plataformas (7 combinações) | SIM | Tabela em `## Matriz de Geração de Artefatos` + passo 4 com 7 opções. |
| `CURSOR.bootstrap.md` via `cursor-md-template.md` | SIM | Seção 4C referencia `@.agents/templates/cursor-md-template.md`; template existe. |
| Nunca sobrescrever `CLAUDE.md`/`AGENTS.md`/`CURSOR.md` | SIM | Regra explícita, checklist e seções 4A–4C reforçam `*.bootstrap.md` apenas. |
| MCP opt-in Cursor → `.cursor/mcp.json` (`mcpServers`) | SIM | Seção 4E com schema JSON, default `Não`, escrita só com `Sim`. |
| MCP opt-in Codex → `.codex/config.toml` | SIM | Seção 4D preservada/renumerada; default `Não`. |
| `AskQuestion` no Cursor + fallback numerado | SIM | Tabela "Ferramenta Interativa por Plataforma" + regra de fallback. |
| Modo não-interativo aborta com mensagem clara | SIM | Seção renomeada e ampliada; inclui `codex exec` e instruções para as 3 plataformas. |
| Source of truth em `.agents/` | SIM | Edição em `.agents/skills/kspec-bootstrap/SKILL.md`; symlink `.cursor/skills/kspec-bootstrap` → `.agents/...` confirmado. |

## Tasks Verificadas
| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 7.1 Pergunta de seleção de plataformas (com "Todas") | COMPLETA | Passo 4 lista as 7 opções; teste valida presença no passo 4. |
| 7.2 Matriz de geração `*.bootstrap.md` (sem sobrescrever finais) | COMPLETA | Matriz + seções condicionais 4A–4C; testes dry-run por linha da tabela. |
| 7.3 MCP opt-in por plataforma (Codex/Cursor), default Não | COMPLETA | 4D (Codex) e 4E (Cursor) com `assumir Não` e confirmação explícita. |
| 7.4 Limitação não-interativo + fallback de perguntas | COMPLETA | Seção inicial + tabela de ferramentas + fallback numerado documentados. |

## Testes
- Total de Testes (suite completa): 156
- Passando: 156
- Falhando: 0
- Testes escopo task 7.0: 11/11 passando (`tests/bootstrap-triplatform.spec.ts`)
- Build: não reexecutado (task sem código compilável); suite Vitest suficiente para escopo.
- Coverage: não instrumentado; cobertura **adequada** para conteúdo de skill via análise estática.

### Casos obrigatórios (Task 7.0 / REQ-004)
| Caso | Coberto | Teste |
|------|---------|-------|
| 7 combinações na matriz de geração | SIM | `documents all 7 platform combinations...` |
| Dry-run: cada linha gera exatamente os arquivos esperados | SIM | `dry-run: each matrix row produces...` |
| Passo 4 oferece todas as opções incluindo Todas | SIM | `lists all platform options in step 4...` |
| Proteção contra sobrescrita de finais | SIM | `never overwrites final docs...` |
| AskQuestion + fallback numerado | SIM | `documents AskQuestion for Cursor...` |
| Aborto em modo não-interativo | SIM | `documents non-interactive abort...` |
| MCP default Não + escrita só com Sim | SIM | `MCP opt-in defaults to Não...` |
| Schema Cursor `mcpServers` (context7 + testsprite) | SIM | `Cursor MCP schema uses mcpServers...` |
| Referência a `cursor-md-template.md` | SIM | `CURSOR.bootstrap.md section references...` |
| Seções condicionais 4A–4E | SIM | `conditional generation sections cover...` |
| Relatório final com próximos passos Cursor | SIM | `final report includes next steps for Cursor` |
| E2E manual (invocação no Cursor, escolha Todas) | PENDENTE | Previsto como manual na task; não automatizado. |

## Problemas Encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa | `.agents/skills/kspec-bootstrap/SKILL.md` | 143, 209, 228, 456, 487 | Passos 2A, 3A, 3B, 5.7 e 6 ainda citam apenas `AskUserQuestion`, enquanto a nova tabela exige ferramenta nativa por plataforma (`AskQuestion` no Cursor). | Substituir por "ferramenta interativa da plataforma (ver tabela)" ou listar as três ferramentas em cada passo. |
| Baixa | `spec/tasks/002-prd-cursor-support/7_task.md` | 37–41 | Subtarefas permanecem `[ ]` apesar da implementação concluída. | Marcar subtarefas e `tasks.md` item 7.0 como concluídos após merge. |
| Baixa | `.agents/skills/kspec-bootstrap/SKILL.md` | 334 vs 365 | Pacote TestSprite difere entre Codex (`@testsprite/mcp`) e Cursor (`testsprite-mcp`). | Documentar intencionalidade ou alinhar com `AGENTS.md`/`CURSOR.md` se for drift. |
| Info | `.agents/validation/enterprise-skills-check.md` | 1 | Stub de 1 linha bloqueia validação empresarial no fluxo padrão. | Restaurar conteúdo completo (pré-existente). |

## Pontos Positivos
- Matriz tri-plataforma completa e simétrica (7 combinações), com dry-run testado linha a linha.
- Extensão consistente do fluxo existente: renumerou MCP Codex para 4D e adicionou 4C/4E sem regressão.
- Proteção explícita contra sobrescrita dos três arquivos finais, reforçada em regras, checklist e testes.
- Modo não-interativo generalizado para as três plataformas (não só Codex `exec`).
- Seção 4C documenta limitações específicas do Cursor (Task tool, `.mdc` derivados, Windows, MCP opt-in).
- Testes significativos para skill Markdown: validam comportamento documentado, não apenas existência de strings soltas.
- Paridade de discovery: symlink `.cursor/skills/kspec-bootstrap` aponta para `.agents/`.

## Recomendações
- Atualizar passos 2A, 3A, 3B, 5.7 e 6 para referenciar a tabela de ferramentas interativas, eliminando ambiguidade no Cursor.
- Executar o teste E2E manual descrito na task (invocar `kspec-bootstrap` no Cursor com "Todas") antes do release 1.3.0.
- Marcar task 7.0 como concluída em `tasks.md` e `7_task.md` após aprovação deste review.
- Considerar teste adicional que valide consistência do pacote TestSprite entre seções Codex e Cursor, se a divergência for intencional.

## Conclusão

A task 7.0 atende os requisitos RF4.1–RF4.5 do PRD e os critérios de sucesso da Tech Spec: matriz tri-plataforma completa, MCP opt-in segregado por plataforma com default **Não**, proteção de arquivos finais e documentação de limitações não-interativas. Os 11 testes de integração estática passam e a suite completa (156 testes) está verde.

**APROVADO COM RESSALVAS** — as ressalvas são não bloqueantes: inconsistência menor na nomenclatura de ferramentas interativas em passos legados da skill, checkboxes de task não atualizados e E2E manual pendente (esperado pelo escopo). Nenhum problema de segurança aplicável (N/A — skill de documentação/orquestração local).
