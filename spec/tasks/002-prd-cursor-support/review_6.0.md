# Relatório de Code Review - Task 6.0: Smoke test + prepublish-check tri-plataforma

## Resumo
- Data: 2026-06-05
- Branch: `002-prd-cursor-support`
- Status: **APROVADO COM RESSALVAS**
- Arquivos Modificados (escopo task 6.0): 2 scripts + artefatos `.cursor/` validados indiretamente
- Linhas Adicionadas: 73 (`smoke.sh` +49, `prepublish-check.sh` +24)
- Linhas Removidas: 3 (`prepublish-check.sh` comentários atualizados)

> **Nota de escopo:** este review avalia `scripts/smoke.sh`, `scripts/prepublish-check.sh` e a estrutura `.cursor/` como alvo de validação. Mudanças em `install.ts`, skills e specs de outras tasks não são reprovadas aqui.

## Validação de Skills Empresariais
- Arquivo `.agents/validation/enterprise-skills-check.md` existe, porém contém apenas 1 linha (`# Validation`; mínimo exigido: 100).
- **Impacto:** validação empresarial bloqueada no fluxo padrão do review-runner; problema **pré-existente**, não introduzido pela task 6.0.
- **Ação recomendada:** restaurar o conteúdo completo antes do release 1.3.0.

## Conformidade com Rules
| Rule | Status | Observações |
|------|--------|-------------|
| `code-standards.md` | OK | Scripts legíveis, funções auxiliares bem nomeadas (`count_resolvable_agent_rules`, `capture_cursor_state`), padrão `set -euo pipefail` mantido. |
| `logging.md` | PARCIAL | `prepublish-check.sh` usa `→/✓/✗` conforme spec. `smoke.sh` mantém formato `PASS/FAIL` legado nos asserts (pré-existente, não regressão). |
| `database.md` | N/A | Sem persistência. |
| `graphify.md` | N/A | Sem grafo gerado. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `smoke.sh` Cenário 1: `.cursor/skills` symlinks ≥ 11 | SIM | Assert `find .cursor/skills -maxdepth 1 -type l >= 11` — passou (11). |
| `smoke.sh` Cenário 1: `.cursor/agents` symlinks ≥ 3 | SIM | Assert `find .cursor/agents -maxdepth 1 -type l >= 3` — passou (3). |
| `smoke.sh` Cenário 1: `.mdc` ≥ rules resolvíveis | SIM | `count_resolvable_agent_rules` + assert `>=` — passou (4 ≥ 4). |
| `smoke.sh` Cenário 1: `CURSOR.md` + `alwaysApply: true` | SIM | `assert_file_exists` + `assert_grep` em `code-standards.mdc`. |
| `smoke.sh` Cenário 3: idempotência `.cursor/` | SIM | `capture_cursor_state` compara symlinks + hashes MD5 dos `.mdc` entre 1º e 2º `update`. |
| `prepublish-check.sh` valida symlinks Cursor (exceto `rules`) | SIM | Verifica `.cursor/templates`, `.cursor/validation`, `.cursor/skills/*`, `.cursor/agents/*`. |
| Zero regressão Claude/Codex | SIM | Todos os asserts originais (Cenários 1–3) passaram; prepublish mantém blocos `.claude/` e `.codex/`. |
| Health check pré-release (Monitoramento) | SIM | `prepublish-check.sh` estendido; integrado em `prepublishOnly`. |

## Tasks Verificadas
| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 6.1 Estender Cenário 1 de `smoke.sh` com asserts Cursor | COMPLETA | 5 novos asserts Cursor no Cenário 1. |
| 6.2 Estender Cenário 3 (idempotência) para `.cursor/` | COMPLETA | `capture_cursor_state` + assert dedicado. |
| 6.3 Estender `prepublish-check.sh` para symlinks Cursor | COMPLETA | 4 blocos adicionados; `.cursor/rules` corretamente excluído. |
| 6.4 Executar ambos os scripts com sucesso | COMPLETA | `npm run smoke` 14/14; `bash scripts/prepublish-check.sh` 43/43. |
| Testes de integração (scripts shell) | COMPLETA | Execução manual conforme critério da task (N/A unitário). |
| Checkboxes em `6_task.md` / `tasks.md` | INCOMPLETA | Implementação concluída, mas `tasks.md` ainda marca 6.0 como pendente e `6_task.md` mantém subtasks `[ ]`. |

## Testes
- Total de Testes (suite Vitest): 156
- Passando: 156
- Falhando: 0
- Smoke (`npm run smoke`): 14/14 asserts passando
- Prepublish (`bash scripts/prepublish-check.sh`): 43/43 symlinks ok
- Build (`npm run build`): sucesso
- Coverage: N/A (Vitest sem relatório configurado)

### Execução smoke.sh (integração)
| Cenário | Asserts | Resultado |
|---------|---------|-----------|
| 1 — `kspec init` | 11 (7 legados + 5 Cursor + 1 combinado docs) | 11/11 PASS |
| 2 — migração abortada | 1 | 1/1 PASS |
| 3 — idempotência | 2 (symlinks globais + `.cursor/`) | 2/2 PASS |

### Symlinks `.cursor/` no repositório (prepublish)
| Diretório | Tipo | Contagem | Resolve para `.agents/` |
|-----------|------|----------|-------------------------|
| `.cursor/skills/` | symlink individual | 11 | SIM |
| `.cursor/agents/` | symlink individual | 3 | SIM |
| `.cursor/templates` | symlink de diretório | 1 | SIM |
| `.cursor/validation` | symlink de diretório | 1 | SIM |
| `.cursor/rules/` | arquivos `.mdc` derivados | 4 | N/A (excluído corretamente) |

## Segurança
N/A — scripts de validação local de filesystem; sem rede, autenticação, execução de conteúdo arbitrário ou exposição de dados sensíveis. `readlink -f` usado apenas para verificar integridade de symlinks no repositório.

## Problemas Encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa | `scripts/smoke.sh` | 72–81 | `count_resolvable_agent_rules` usa `head -c 1` como proxy de "resolvível"; não valida `readlink -f` nem distingue symlink quebrado de arquivo vazio. Funciona no cenário atual (ignora ELOOP de rules empresariais), mas é heurística frágil. | Usar `readlink -f` + teste de existência, alinhado a `check_symlink` do prepublish. |
| Baixa | `scripts/smoke.sh` | 84–94 | `capture_cursor_state` usa `readlink` (não `-f`) e MD5 com fallback `md5`/`md5sum`; adequado para macOS/Linux, mas sem mensagem de erro se ambos falharem. | Aceitável; documentar dependência de `md5` ou `md5sum` no header do script. |
| Baixa | `scripts/smoke.sh` | — | Formato de saída `PASS/FAIL` diverge do padrão `→/✓/✗` de `logging.md` (legado pré-task). | Harmonizar em refactor futuro; fora do escopo 6.0. |
| Baixa | `spec/tasks/002-prd-cursor-support/tasks.md` | 12 | Task 6.0 ainda `[ ]` apesar da implementação completa. | Marcar `[x]` e atualizar checkboxes em `6_task.md`. |
| Baixa | `.agents/validation/enterprise-skills-check.md` | — | Arquivo truncado (1 linha). | Restaurar conteúdo completo antes do release (pré-existente). |

## Pontos Positivos
- Cobertura Cursor adicionada sem alterar a estrutura dos cenários existentes — regressão zero comprovada.
- `prepublish-check.sh` espelha fielmente o padrão já usado para `.claude/` (dir links + find com `-print0`).
- Idempotência de `.cursor/` validada separadamente dos symlinks globais, capturando hashes dos `.mdc` (artefatos derivados, não symlinks).
- `prepublish-check.sh` exclui corretamente `.cursor/rules/` (derivado), conforme Tech Spec.
- Execução real de `npm run smoke` após `build` + `link` confirma fluxo end-to-end com kspec v1.3.0.
- `.cursor/` agora versionado no git (symlinks + `.mdc`), endereçando ressalva da review 5.0 sobre tarball sem `.cursor/`.

## Recomendações
- Atualizar `tasks.md` e `6_task.md` para refletir conclusão da task 6.0.
- Considerar assert de migração Cursor (`.cursor/skills` como dir real) em task futura — fora do escopo 6.0, mas alinhado à extensão de `migration.ts` (task 4.0).
- Restaurar `enterprise-skills-check.md` antes do release 1.3.0.
- Opcional: adicionar smoke assert explícito para `.cursor/templates` e `.cursor/validation` como symlinks (hoje cobertos indiretamente pelo prepublish e pelo `init`).

## Conclusão
A task 6.0 atende integralmente os requisitos da Tech Spec e do `6_task.md`: asserts Cursor no Cenário 1, idempotência no Cenário 3, validação de symlinks Cursor no prepublish (exceto `rules`), e zero regressão nos cenários Claude/Codex. Todos os testes automatizados (156 Vitest) e os scripts de integração (`smoke.sh` 14/14, `prepublish-check.sh` 43/43) passaram.

**Parecer: APROVADO COM RESSALVAS** — ressalvas não bloqueantes: heurística simplificada em `count_resolvable_agent_rules`, documentação de tasks não atualizada, e `enterprise-skills-check.md` truncado (pré-existente). A implementação está pronta para merge; recomenda-se marcar a task como concluída nos artefatos de spec antes do release.
