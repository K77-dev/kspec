# Relatório de Code Review - Task 1.0: Conversor `.md → .mdc` (`ruleToMdc`)

## Resumo
- Data: 2026-06-05
- Branch: `002-prd-cursor-support`
- Status: **APROVADO COM RESSALVAS**
- Arquivos Modificados (escopo task 1.0): 2 (`src/lib/install.ts`, `tests/rule-to-mdc.spec.ts`)
- Linhas Adicionadas: ~269 (134 em `install.ts` + 135 em testes)
- Linhas Removidas: 0

> **Nota de escopo:** o working tree também contém mudanças em `.agents/skills/kspec-implement/SKILL.md`, `kspec-qa/SKILL.md` e `kspec-version/SKILL.md` — fora do escopo da task 1.0 (pertencem à task 7.0). Este review avalia exclusivamente `ruleToMdc` e seus testes.

## Validação de Skills Empresariais
- Arquivo `.agents/validation/enterprise-skills-check.md` existe, porém contém apenas 1 linha (mínimo exigido: 100).
- **Impacto:** validação empresarial bloqueada no fluxo padrão do review-runner; problema **pré-existente** no repositório kspec, não introduzido pela task 1.0.
- **Ação recomendada:** restaurar o conteúdo completo do arquivo de validação antes do release 1.3.0.

## Conformidade com Rules
| Rule | Status | Observações |
|------|--------|-------------|
| `code-standards.md` | OK | Nomenclatura clara (`ruleToMdc`, `parseRuleRaw`, `extractDescription`); funções pequenas e com responsabilidade única; sem dependências novas. |
| `logging.md` | N/A | Função pura sem I/O; sem mensagens de log. |
| `database.md` | N/A | Sem persistência. |
| `graphify.md` | N/A | Sem grafo gerado. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `ruleToMdc(name, raw)` inline em `install.ts` | SIM | Função exportada para testabilidade; helpers privados bem decompostos. |
| Interfaces `RuleFrontmatter` / `MdcFrontmatter` | SIM | Contratos conforme Tech Spec. |
| Heurística `paths` → `globs` CSV + `alwaysApply: false` | SIM | Teste (a) valida CSV com aspas YAML. |
| Sem `paths` → `alwaysApply: false` | SIM | Testes (c) e (b) cobrem. |
| Exceção `code-standards` → `alwaysApply: true` | SIM | Testes (b) e caso combinado com `paths`. |
| Extração `description` (`h1_body`) | SIM | Cadeia completa: frontmatter → H1 → primeira linha → nome legível. |
| Corpo preservado byte a byte | SIM | Teste (d) com blocos de código no corpo. |
| Idempotência (mesmo hash) | SIM | Teste (e) com `sha256`. |
| Sem dependência externa nova | SIM | Apenas `node:crypto` (já usado no arquivo). |

## Tasks Verificadas
| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 1.1 Interfaces + parser frontmatter | COMPLETA | `RuleFrontmatter`, `MdcFrontmatter`, `parseRuleRaw`, `parseRuleFrontmatterBlock`. |
| 1.2 Heurística globs/alwaysApply + description | COMPLETA | `buildMdcFrontmatter`, `extractDescription`, `readableRuleName`. |
| 1.3 Renderização `.mdc` final | COMPLETA | `renderMdcFrontmatter` + `yamlScalar` para valores com caracteres especiais. |
| 1.4 Testes unitários Vitest | COMPLETA | 9 testes em `tests/rule-to-mdc.spec.ts`; cobre (a)–(e) e edge cases extras. |

## Testes
- Total de Testes (suite completa): 116
- Passando: 116
- Falhando: 0
- Testes `ruleToMdc`: 9/9 passando
- Build (`npm run build`): sucesso
- Coverage: não instrumentado no projeto; cobertura qualitativa **adequada** para task 1.0

### Casos obrigatórios (Tech Spec)
| Caso | Coberto | Teste |
|------|---------|-------|
| (a) `paths` → `globs` CSV, `alwaysApply: false` | SIM | `rule com paths gera globs CSV...` |
| (b) `code-standards` → `alwaysApply: true` | SIM | `code-standards gera alwaysApply true` |
| (c) sem `paths`/sem `description` → H1 | SIM | `rule sem paths e sem description...` |
| (d) corpo preservado byte a byte | SIM | `preserva o corpo byte a byte` |
| (e) idempotência (hash) | SIM | `conversão é idempotente...` |

### Edge cases adicionais (bônus)
- `description` explícita no frontmatter tem prioridade sobre H1
- Primeira linha não vazia como fallback
- Nome legível do arquivo como fallback final
- `code-standards` com `paths` mantém `globs` **e** `alwaysApply: true`

## Segurança
N/A — transformação pura de string; sem I/O, rede, autenticação ou execução de conteúdo. Risco de segurança inexistente nesta task.

## Problemas Encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Média | `.agents/skills/kspec-implement/SKILL.md` (etc.) | — | Mudanças em 3 skills no mesmo working tree, fora do escopo da task 1.0. | Separar em commit/PR da task 7.0; manter task 1.0 focada em `install.ts` + testes. |
| Baixa | `src/lib/install.ts` | 72–74 | Parser de `description` não remove aspas YAML (`"valor"`). | Aceitável para rules atuais; adicionar strip de aspas se rules empresariais usarem formato quoted. |
| Baixa | `src/lib/install.ts` | 37 | Regex exige `\n` (LF); CRLF no frontmatter não seria reconhecido. | Rules canônicas usam LF; documentar ou normalizar `\r\n` se necessário no futuro. |
| Baixa | `.agents/validation/enterprise-skills-check.md` | — | Arquivo truncado (1 linha). | Restaurar conteúdo completo via `npx @k77-dev/kspec install` ou correção manual. |

## Pontos Positivos
- Implementação alinhada ao contrato da Tech Spec, com decomposição limpa em helpers testáveis.
- `yamlScalar` trata corretamente globs com `*`, `:` e outros caracteres especiais — essencial para rules reais como `database.md` e `logging.md`.
- Suite de testes vai além do mínimo exigido, cobrindo toda a cadeia de fallback de `description` e o caso `code-standards` + `paths`.
- Função pura (`ruleToMdc`) sem efeitos colaterais — ideal como núcleo isolado antes da integração filesystem (task 2.0).
- Sem dependências novas; reutiliza padrões já presentes em `install.ts` (`hashContent`, estilo de código).

## Recomendações
- Isolar as mudanças de skills (`kspec-implement`, `kspec-qa`, `kspec-version`) em commit separado da task 7.0.
- Na task 2.0 (`buildCursorRulesMdc`), validar conversão end-to-end com as 4 rules reais de `.agents/rules/*.md`.
- Considerar teste com conteúdo real de `database.md` (5 globs) para garantir CSV longo sem regressão.
- Restaurar `enterprise-skills-check.md` antes do release.

## Conclusão

A implementação da **task 1.0** atende integralmente aos requisitos da Tech Spec e aos critérios de sucesso: `ruleToMdc` implementa a heurística correta, preserva o corpo byte a byte, é idempotente, e possui testes unitários abrangentes — todos passando, com build limpo.

O parecer é **APROVADO COM RESSALVAS** devido a (1) mudanças fora de escopo em skills no mesmo working tree, que devem ser desacopladas da entrega desta task, e (2) arquivo de validação empresarial truncado no repositório (pré-existente). Nenhum desses pontos bloqueia a progressão para a **task 2.0** (integração filesystem com `buildCursorRulesMdc`).
