# Relatório de Code Review - Task 3.0: `CURSOR.md` + template + `ensureRootDocs`

## Resumo
- Data: 2026-06-05
- Branch: `002-prd-cursor-support`
- Status: **APROVADO COM RESSALVAS**
- Arquivos Modificados (escopo task 3.0): 5 (`CURSOR.md`, `.agents/templates/cursor-md-template.md`, `src/lib/install.ts`, `src/utils/paths.ts`, `tests/install.spec.ts`)
- Linhas Adicionadas: ~245 (114 `CURSOR.md` + 103 template + ~8 `ensureRootDocs`/`InstallOptions` + ~20 testes)
- Linhas Removidas: ~2 (renomeação de teste AGENTS/CLAUDE → tri-plataforma)

> **Nota de escopo:** `install.ts` e `tests/install.spec.ts` contêm também mudanças das tasks 1.0 e 2.0 (conversor `.mdc`, symlinks Cursor). Este review avalia exclusivamente `CURSOR.md`, `cursor-md-template.md`, extensão de `ensureRootDocs`/`getCursorMdSource` e testes associados.

## Validação de Skills Empresariais
- Arquivo `.agents/validation/enterprise-skills-check.md` existe, porém contém apenas 1 linha (mínimo exigido: 100).
- **Impacto:** validação empresarial bloqueada no fluxo padrão do review-runner; problema **pré-existente** no repositório kspec, não introduzido pela task 3.0.
- **Ação recomendada:** restaurar o conteúdo completo do arquivo de validação antes do release 1.3.0.

## Conformidade com Rules
| Rule | Status | Observações |
|------|--------|-------------|
| `code-standards.md` | OK | Extensão mínima de `ensureRootDocs` segue o padrão existente (array de docs + guard `pathExists`); `getCursorMdSource()` espelha `getClaudeMdSource()`/`getAgentsMdSource()`. |
| `logging.md` | OK | Mensagem `✓ Criado: CURSOR.md` em pt-BR, consistente com AGENTS/CLAUDE. |
| `database.md` | N/A | Sem persistência. |
| `graphify.md` | N/A | Sem grafo gerado. |

## Segurança
| Item | Status | Observações |
|------|--------|-------------|
| Validação de inputs | N/A | CLI local; cópia de arquivo estático do pacote. |
| Sobrescrita de docs finais | OK | Guard `if (await pathExists(dest)) continue` preserva `CURSOR.md` customizado pelo usuário. |
| Secrets hardcoded | OK | Nenhum. |
| Demais itens do checklist | N/A | Sem backend/API. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `CURSOR.md` na raiz + `cursor-md-template.md` em `.agents/templates/` | SIM | Ambos presentes e versionados. |
| `ensureRootDocs` estendida para materializar `CURSOR.md` | SIM | Terceiro item no array `docs`; chamada em `runInstall` após camada Cursor. |
| `getCursorMdSource()` em `paths.ts` | SIM | Resolve `CURSOR.md` no package root; `sourceCursorMd` opcional em `InstallOptions` para testes. |
| Guard `pathExists` — não sobrescrever doc final | SIM | Teste de idempotência dedicado. |
| Coerência com `CLAUDE.md`/`AGENTS.md` | SIM | Mesmas 9 skills, mesmos 3 agents, mesmas 4 rules canônicas; conteúdo adaptado ao Cursor (Task tool, `.mdc`, `AskQuestion`). |
| `package.json#files` inclui `CURSOR.md` | NÃO (task 5.0) | Fora do escopo desta task; necessário antes do release. |

## Verificação de Requisitos (PRD REQ-002 / RF2.x)
| Requisito | Status | Observações |
|-----------|--------|-------------|
| RF2.1 — Skills com invocação Cursor | OK | Tabela com linguagem natural + menção explícita para as 9 skills. |
| RF2.2 — Delegação via Task tool / `subagent_type` | OK | Tabela de agents com coluna `subagent_type`; limitação #2 documenta os 3 tipos. |
| RF2.3 — Rules canônicas + publicação `.mdc` | OK | Tabela com `.agents/rules/` e `.cursor/rules/*.mdc`; instrução de regen com `kspec update`. |
| RF2.4 — Limitações conhecidas no Cursor | OK | 6 itens: slash commands, Task tool, rules derivadas, Windows, MCP opt-in. |
| RF2.5 — `AskQuestion` equivalente | OK | Item #6 da seção de limitações com equivalências Claude/Codex. |
| RF2.6 — Coerência com `CLAUDE.md`/`AGENTS.md` | OK | Descrição do projeto, skills e paths alinhados; extensões Cursor são aditivas e esperadas. |

## Tasks Verificadas
| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 3.1 — Criar `cursor-md-template.md` | COMPLETA | Template com placeholders para bootstrap e seções fixas de skills/agents/limitações. |
| 3.2 — Gerar `CURSOR.md` na raiz | COMPLETA | Doc completo do projeto kspec (não stub); 114 linhas. |
| 3.3 — Estender `ensureRootDocs` | COMPLETA | `cursorMdSource` adicionado; padrão idêntico a AGENTS/CLAUDE. |
| 3.4 — Testes de geração do doc | COMPLETA | Criação quando ausente + não-sobrescrita quando presente. |

## Testes
- Total de Testes: 139
- Passando: 139
- Falhando: 0
- Coverage: não medido (Vitest sem threshold configurado)

### Testes relevantes à task 3.0
| Teste | Arquivo | Resultado |
|-------|---------|-----------|
| `creates AGENTS.md, CLAUDE.md and CURSOR.md in target root when absent` | `tests/install.spec.ts` | PASS |
| `second runInstall does not overwrite existing CURSOR.md` | `tests/install.spec.ts` | PASS |
| `getCursorMdSource returns path ending in CURSOR.md` | `tests/paths.spec.ts` | PASS (task 2.0, consumido pela 3.0) |

## Problemas Encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa | `.agents/templates/cursor-md-template.md` | 95–103 | Item 2 de limitações não enumera os 3 `subagent_type`; item 6 lista apenas 4 skills interativas (falta `kspec-implement`, `kspec-bugfix`) — drift em relação ao `CURSOR.md` final. | Alinhar template ao conteúdo de `CURSOR.md` (linhas 106–114) antes da task 7.0 (`kspec-bootstrap`). |
| Baixa | `tests/install.spec.ts` | 180–192 | Testes validam apenas stub `# Cursor Guide`, não estrutura RF2.x (tabelas, seções, limitações). | Aceitável para unit test de `ensureRootDocs`; cobertura de conteúdo real fica para smoke test (task 6.0). |
| Baixa | `.agents/validation/enterprise-skills-check.md` | 1 | Arquivo truncado (1 linha). | Restaurar antes do release 1.3.0. |

## Pontos Positivos
- `ensureRootDocs` reutiliza o padrão existente sem duplicação — alteração cirúrgica (3 linhas no array + parâmetro).
- `CURSOR.md` cobre integralmente RF2.1–RF2.5 com estrutura espelhando `AGENTS.md` (tabelas, MCP opt-in, limitações).
- Teste de não-sobrescrita espelha o de `AGENTS.md`, garantindo contrato de doc final preservado.
- `sourceCursorMd` em `InstallOptions` permite testes isolados sem depender do package root real.
- Mensagens de log em pt-BR (`✓ Criado: CURSOR.md`) conforme `logging.md`.

## Recomendações
- Sincronizar `cursor-md-template.md` com `CURSOR.md` (subagent_types explícitos e lista completa de skills interativas) antes do bootstrap tri-plataforma (task 7.0).
- Na task 6.0, adicionar assert de presença e conteúdo mínimo de `CURSOR.md` no `smoke.sh` (conforme Tech Spec).
- Incluir `CURSOR.md` em `package.json#files` na task 5.0 para cumprir RF2 de distribuição.

## Conclusão

A task 3.0 atende os critérios de sucesso: `CURSOR.md` e o template existem, `ensureRootDocs` materializa o doc sem sobrescrever versões finais, e os testes unitários de criação/idempotência passam (139/139 no suite completo). O conteúdo de `CURSOR.md` cumpre RF2.1–RF2.6 do PRD e a extensão de código segue o design da Tech Spec.

**APROVADO COM RESSALVAS** pelo drift entre template e doc final (impacto limitado à task 7.0, não ao fluxo `kspec init` desta entrega) e pela ausência de validação de conteúdo estrutural nos testes unitários (coberta indiretamente na task 6.0).
