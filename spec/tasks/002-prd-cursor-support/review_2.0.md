# Relatório de Code Review - Task 2.0: Funções Cursor em `install.ts` + `paths.ts`

## Resumo
- Data: 2026-06-05
- Branch: `002-prd-cursor-support`
- Status: **APROVADO COM RESSALVAS**
- Arquivos Modificados (escopo task 2.0): 5 (`src/lib/install.ts`, `src/utils/paths.ts`, `tests/install.spec.ts`, `tests/paths.spec.ts`, `tests/commands.spec.ts`)
- Linhas Adicionadas: 440
- Linhas Removidas: 3

> **Nota de escopo:** o working tree também contém mudanças em `.agents/skills/kspec-implement/SKILL.md`, `kspec-qa/SKILL.md` e `kspec-version/SKILL.md` — fora do escopo da task 2.0 (pertencem à task 7.0/8.0). O diff de `install.ts` inclui código da task 1.0 (`ruleToMdc`), dependência explícita da task 2.0; a avaliação abaixo foca nas funções Cursor e integração em `runInstall`.

## Validação de Skills Empresariais
- Arquivo `.agents/validation/enterprise-skills-check.md` existe, porém contém apenas 1 linha (`# Validation`; mínimo exigido: 100).
- **Impacto:** validação empresarial bloqueada no fluxo padrão do review-runner; problema **pré-existente** no repositório kspec, não introduzido pela task 2.0.
- **Ação recomendada:** restaurar o conteúdo completo do arquivo de validação antes do release 1.3.0.

## Conformidade com Rules
| Rule | Status | Observações |
|------|--------|-------------|
| `code-standards.md` | OK | Funções Cursor seguem o padrão de `buildClaudeLinks`/`buildCodexAgentsToml`; reuso de `linkOrCopy`, `hashContent`, `isRealFile`; nomenclatura consistente (`buildCursorSkillsLinks`, `CURSOR_DIR_LINKS`). |
| `logging.md` | OK | Mensagens pt-BR com `✓` (symlinks/geração), `→` (poda de órfão), `✗` (rule ignorada via `console.warn` + `chalk.yellow`); sem dados sensíveis. |
| `database.md` | N/A | Sem persistência. |
| `graphify.md` | N/A | Sem grafo gerado. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `buildCursorSkillsLinks` — symlinks `.cursor/skills/` | SIM | Espelha padrão Claude; usa `linkOrCopy` idempotente. |
| `buildCursorAgentsLinks` — symlinks `.cursor/agents/` | SIM | Idêntico ao padrão existente. |
| `buildCursorDirLinks` — `templates` + `validation` (sem `rules`) | SIM | `CURSOR_DIR_LINKS = ["templates", "validation"]`; `rules` é diretório derivado real. |
| `buildCursorRulesMdc` — conversão + hash skip + poda órfãos | SIM | Reutiliza `ruleToMdc`; poda via `rm` com log `→ Removido órfão`. |
| Symlink quebrado → `skip_warn` sem falhar comando | SIM | `try/catch` em leitura; aviso `✗ rule X ignorada: alvo não resolvido`; erro acumulado em `report.errors`. |
| `InstallReport` estendido | SIM | `linkedCursorSkills`, `linkedCursorAgents`, `generatedMdc`. |
| `getCursorMdSource()` / `getCursorSourceDir()` em `paths.ts` | SIM | Resolvers adicionados; uso em `ensureRootDocs` é escopo da task 3.0. |
| Integração em `runInstall` após Claude e Codex | SIM | Sequência correta; erros TOML + MDC concatenados. |
| Idempotência (symlinks + `.mdc`) | SIM | `linkOrCopy` + hash; testes com `mtimeMs` inalterado. |
| Windows fallback via `linkOrCopy` | SIM | Cópia automática; aviso `⚠ Windows detectado` só em `buildClaudeLinks` (ver ressalvas). |

## Tasks Verificadas
| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 2.1 Estender `InstallReport` + resolvedores `paths.ts` | COMPLETA | Interface e funções exportadas conforme spec. |
| 2.2 `buildCursorSkillsLinks`, `buildCursorAgentsLinks`, `buildCursorDirLinks` | COMPLETA | Três funções implementadas e integradas. |
| 2.3 `buildCursorRulesMdc` (conversão + hash + poda + symlink quebrado) | COMPLETA | Todos os comportamentos exigidos presentes. |
| 2.4 Integração na sequência de `runInstall` | COMPLETA | Após Codex, antes de `ensureRootDocs`. |
| 2.5 Testes unitários de FS (`tmpdir`) | COMPLETA | 8 testes em `runInstall — camada Cursor` + 4 em `paths.spec.ts`. |

## Testes
- Total de Testes (suite completa): 128
- Passando: 128
- Falhando: 0
- Testes novos (escopo task 2.0): 12 (8 install + 4 paths)
- Build (`npm run build`): sucesso
- Coverage: não instrumentado no projeto; cobertura qualitativa **adequada**

### Casos obrigatórios (task 2.0)
| Caso | Coberto | Teste |
|------|---------|-------|
| Symlinks `.cursor/skills`, `.cursor/agents`, `.cursor/templates`, `.cursor/validation` | SIM | 3 testes (skip win32) |
| Geração `.mdc` com `alwaysApply: true` em `code-standards` | SIM | `generates .mdc files from .agents/rules/*.md` |
| Symlink quebrado → aviso, install não falha | SIM | `skips broken rule symlinks with warning...` |
| Poda de `.mdc` órfão | SIM | `prunes orphan .mdc files...` |
| Idempotência symlinks Cursor (2× update) | SIM | `second runInstall does not recreate .cursor symlinks` |
| Idempotência `.mdc` (hash) | SIM | `second runInstall does not rewrite .mdc...` |
| `getCursorSourceDir` / `getCursorMdSource` | SIM | 4 testes em `paths.spec.ts` |
| `InstallReport` com campos Cursor | SIM | `returns report with linked skills...` + mocks em `commands.spec.ts` |

## Segurança
N/A — CLI local de instalação de arquivos; sem backend, autenticação ou rede. Conversão `.mdc` é leitura/escrita de texto; symlinks seguem o padrão existente do kspec. Sem secrets hardcoded.

## Problemas Encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Média | `.agents/skills/kspec-implement/SKILL.md` (etc.) | — | Mudanças em 3 skills no mesmo working tree, fora do escopo da task 2.0. | Separar em commit/PR da task 7.0/8.0. |
| Baixa | `src/lib/install.ts` | 213–215 | Aviso `⚠ Windows detectado` emitido apenas em `buildClaudeLinks`; funções Cursor usam `linkOrCopy` silenciosamente no Windows. | Extrair aviso para `runInstall` (uma vez) ou reutilizar helper compartilhado. |
| Baixa | `src/utils/paths.ts` | 38–44 | `getCursorMdSource()`/`getCursorSourceDir()` ainda não consumidos em `install.ts`. | Esperado — integração em `ensureRootDocs` é task 3.0; sem bloqueio. |
| Baixa | `src/lib/install.ts` | 386 | Nome de rule com symlink quebrado entra em `sourceRuleNames` antes do `try/catch`. | Comportamento aceitável (evita poda indevida); documentar se necessário. |
| Baixa | `.agents/validation/enterprise-skills-check.md` | — | Arquivo truncado (1 linha). | Restaurar conteúdo completo antes do release 1.3.0. |

## Pontos Positivos
- Paridade estrutural exemplar com `buildClaudeLinks` — baixo risco de regressão e fácil manutenção.
- `buildCursorRulesMdc` completo: conversão, hash skip, poda de órfãos e tratamento `skip_warn` conforme decisão da Tech Spec.
- Suite de testes robusta com `tmpdir` real, cobrindo caminho feliz, edge cases (symlink quebrado, órfãos) e idempotência.
- `commands.spec.ts` atualizado para refletir o novo contrato de `InstallReport`, evitando quebra de mocks.
- Erros de TOML e MDC agregados sem abortar a instalação das demais plataformas.

## Recomendações
- Avançar para task 3.0 (`CURSOR.md` + `ensureRootDocs`) consumindo `getCursorMdSource()`.
- Centralizar aviso Windows no início de `runInstall` para cobrir Claude, Codex e Cursor de forma uniforme.
- Restaurar `.agents/validation/enterprise-skills-check.md` antes do release.
- Manter mudanças de skills (task 7.0/8.0) em commits separados da task 2.0.

## Conclusão
A task 2.0 está **implementada corretamente** e em conformidade com PRD, Tech Spec e critérios de aceite. Todas as funções Cursor (`buildCursorSkillsLinks`, `buildCursorAgentsLinks`, `buildCursorDirLinks`, `buildCursorRulesMdc`) estão presentes, integradas em `runInstall`, com `InstallReport` estendido e resolvedores em `paths.ts`. Os 128 testes passam, incluindo cenários de symlink quebrado, poda de órfãos e idempotência.

**APROVADO COM RESSALVAS** — ressalvas não bloqueantes: arquivo de validação empresarial truncado (pré-existente), mudanças de skills fora de escopo no working tree, e aviso Windows não replicado na camada Cursor. Nenhuma ressalva impede o avanço para a task 3.0.
