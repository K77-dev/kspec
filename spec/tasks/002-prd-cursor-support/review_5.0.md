# Relatório de Code Review - Task 5.0: Distribuição e versionamento 1.3.0

## Resumo
- Data: 2026-06-05
- Branch: `002-prd-cursor-support`
- Status: **APROVADO COM RESSALVAS**
- Arquivos Modificados (escopo task 5.0): 4 (`package.json`, `VERSION`, `tests/distribution.spec.ts`, `.cursor/` como artefato de distribuição)
- Linhas Adicionadas: ~52 (5 em `package.json` + 1 em `VERSION` + 46 em `tests/distribution.spec.ts`)
- Linhas Removidas: 3 (`package.json` + `VERSION`)

> **Nota de escopo:** o working tree contém mudanças de outras tasks (`install.ts`, skills, specs). Este review avalia exclusivamente distribuição, versionamento 1.3.0, metadados do pacote e testes de distribuição.

## Validação de Skills Empresariais
- Arquivo `.agents/validation/enterprise-skills-check.md` existe, porém contém apenas 1 linha (`# Validation`; mínimo exigido: 100).
- **Impacto:** validação empresarial bloqueada no fluxo padrão do review-runner; problema **pré-existente**, não introduzido pela task 5.0.
- **Ação recomendada:** restaurar o conteúdo completo antes do release 1.3.0.

## Conformidade com Rules
| Rule | Status | Observações |
|------|--------|-------------|
| `code-standards.md` | OK | Metadados consistentes; `files` mantém ordem lógica (plataformas agrupadas); sem dependências novas. |
| `logging.md` | N/A | Task não altera saída de console. |
| `database.md` | N/A | Sem persistência. |
| `graphify.md` | N/A | Sem grafo gerado. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `package.json#files` += `.cursor/`, `CURSOR.md` | SIM | Entradas adicionadas sem remover artefatos existentes (`dist/`, `.agents/`, `.codex/`, `AGENTS.md`, etc.). |
| `VERSION` e `version` → `1.3.0` | SIM | Ambos reportam `1.3.0`; bump de `1.2.0` conforme RF6.3. |
| `description`/`keywords` incluem `cursor` | SIM | Description menciona "Cursor"; keyword `"cursor"` adicionada. |
| Distribuição tri-plataforma no tarball | PARCIAL | Tarball inclui `.cursor/rules/*.mdc` (4 arquivos derivados) + `CURSOR.md`; symlinks `.cursor/skills|agents|templates|validation` **não** entram no pack (comportamento npm idêntico a `.claude/`). Mitigado por `.agents/` no tarball + `kspec init/update`. |
| `prepublish-check.sh` estendido para `.cursor/` | NÃO | Escopo da task 6.0; script atual valida apenas `.claude/` e `.codex/`. |

## Tasks Verificadas
| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 5.1 Atualizar `package.json#files` (`.cursor/`, `CURSOR.md`) | COMPLETA | Ambos presentes em `files`. |
| 5.2 Bump de versão em `package.json` e `VERSION` para `1.3.0` | COMPLETA | Sincronizados. |
| 5.3 Atualizar `description`/`keywords` com `cursor` | COMPLETA | Texto e keyword atualizados. |
| Testes: `npm pack --dry-run` lista `.cursor/` e `CURSOR.md` | COMPLETA | 5 testes em `distribution.spec.ts`; passam na suite completa (156/156). |

## Testes
- Total de Testes (suite completa): 156
- Passando: 156
- Falhando: 0
- Testes escopo task 5.0: 5/5 passando (`distribution.spec.ts`)
- Build (`npm run build`): sucesso
- Coverage: N/A (Vitest sem relatório configurado)

### Verificação manual de tarball
| Artefato | Presente no `npm pack` |
|----------|------------------------|
| `CURSOR.md` | SIM (7.2 kB) |
| `.cursor/rules/*.mdc` | SIM (4 arquivos) |
| `.cursor/skills/` (symlinks) | NÃO (limitação npm) |
| `.cursor/agents/` (symlinks) | NÃO (limitação npm) |
| `.agents/` (source of truth) | SIM (completo) |

### Casos cobertos pelos testes
| Caso | Coberto | Teste |
|------|---------|-------|
| `package.json#version` = `1.3.0` | SIM | `package.json version is 1.3.0` |
| `VERSION` = `1.3.0` | SIM | `VERSION file is 1.3.0` |
| `files` inclui `.cursor/` e `CURSOR.md` | SIM | `package.json files includes...` |
| `description` e `keywords` mencionam cursor | SIM | `description and keywords mention cursor` |
| `npm pack --dry-run` lista `.cursor/` e `CURSOR.md` | SIM | `npm pack --dry-run lists...` |

## Segurança
N/A — alteração exclusiva de metadados de pacote e testes de distribuição; sem rede, autenticação, execução de conteúdo ou exposição de dados sensíveis.

## Problemas Encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Média | `.cursor/` (git) | — | Diretório `.cursor/` não está versionado no git (`??`), enquanto `.claude/` e `.codex/` estão tracked. Clone limpo + `prepublishOnly` (sem `npm test`) não gera `.cursor/rules/*.mdc` — tarball sai **sem** `.cursor/`. | Commitar `.cursor/rules/*.mdc` e symlinks (paridade com `.claude/`) **ou** incluir geração em `prepublishOnly` (ex.: `sync-cursor-layer` antes do pack). |
| Média | `package.json` | 26 | `prepublishOnly` executa apenas `build` + `prepublish-check.sh`; não garante presença de `.cursor/` para publicação. | Estender hook ou documentar passo obrigatório de `kspec update` pré-release (task 6.0 pode endereçar). |
| Baixa | `tests/distribution.spec.ts` | 10–17 | Versão `1.3.0` hardcoded; quebra no próximo bump sem editar testes. | Comparar `pkg.version === readFileSync(VERSION).trim()` em vez de literal fixo. |
| Baixa | `tests/distribution.spec.ts` | 36–44 | Teste `npm pack` falha isoladamente se `.cursor/` não existir (4/5 passam, 1 falha). Depende implicitamente de `scripts/sync-cursor-layer.spec.ts` na suite completa ou de artefatos locais. | Adicionar `beforeAll` que garante `.cursor/rules/*.mdc` ou marcar dependência explícita entre specs. |
| Baixa | `scripts/prepublish-check.sh` | — | Não valida symlinks `.cursor/` (escopo task 6.0). | Implementar na task 6.0 conforme Tech Spec. |
| Baixa | `.agents/validation/enterprise-skills-check.md` | — | Arquivo truncado (1 linha). | Restaurar conteúdo completo antes do release. |

## Pontos Positivos
- Mudanças mínimas e focadas: apenas metadados necessários para RF3.4 e RF6.3.
- `files` preserva todos os artefatos existentes; adição não destrutiva.
- `description` atualizada de forma clara, listando as três plataformas.
- `tests/distribution.spec.ts` cobre todos os critérios de sucesso da task (metadados + integração `npm pack`).
- Bump semver correto (`1.2.0` → `1.3.0`, minor retrocompatível conforme Tech Spec).
- Regressão zero na suite completa (156 testes passando).

## Recomendações
- Versionar `.cursor/` no repositório (symlinks + `.mdc` derivados) antes do publish, espelhando `.claude/` e `.codex/`.
- Refatorar testes de versão para ler `VERSION` dinamicamente em vez de hardcode.
- Na task 6.0, estender `prepublish-check.sh` e `smoke.sh` para cobrir `.cursor/` e fechar a lacuna de tarball em CI limpo.
- Considerar assert adicional no teste de pack para contagem mínima de `.cursor/rules/*.mdc` (≥ contagem de `.agents/rules/*.md` resolvíveis).

## Conclusão
A task 5.0 atende os requisitos funcionais: `package.json#files` inclui `.cursor/` e `CURSOR.md`, versão sincronizada em `1.3.0`, e metadados (`description`/`keywords`) referenciam Cursor. Os 5 testes de distribuição passam na suite completa e o tarball local contém `CURSOR.md` e `.cursor/rules/*.mdc`.

**Ressalvas não bloqueantes:** (1) `.cursor/` ainda não está no git, o que pode gerar tarball incompleto em publish a partir de clone limpo; (2) teste de pack depende de artefatos pré-existentes ou da execução prévia de `sync-cursor-layer.spec.ts`; (3) validação de symlinks `.cursor/` fica para a task 6.0.

**Parecer:** **APROVADO COM RESSALVAS** — pronto para integração na branch de feature, com recomendação de resolver versionamento de `.cursor/` antes do release npm 1.3.0.
