# Tarefa 5.0: Suite de coerência estática e validação de paridade entre plataformas

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Requisitos Atendidos

- REQ-005 — Paridade entre plataformas e distribuição via CLI

## Dependências

- 1.0, 2.0, 3.0, 4.0

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Consolidar a suite `tests/clean-code-solid-coherence.spec.ts` com todas as asserções estáticas definidas na techspec, garantir que `npm test` permaneça verde e validar que o pipeline de distribuição existente (`ruleToMdc`, symlinks, `agent-toml`) propaga as mudanças sem alterações em `src/lib/install.ts`.

<skills>
### Conformidade com Skills Padrões

- Padrão de testes estáticos já usado em `tests/skills-coherence.spec.ts` e `tests/docs-coherence.spec.ts`.
- `.agents/rules/graphify.md` — N/A (sem código executável novo em `src/`).
</skills>

<requirements>
- Completar `tests/clean-code-solid-coherence.spec.ts` com todos os blocos de asserção da techspec. (RF-005.1)
- Validar que alterações em `.agents/rules/code-standards.md` propagam para `.cursor/rules/code-standards.mdc` via `ruleToMdc`. (RF-005.1, RF-005.2)
- Confirmar `alwaysApply: true` no `.mdc` gerado. (RF-005.2)
- Confirmar que agents atualizados propagam via symlinks (`.claude/agents/`) e artefatos Codex (`.codex/agents/*.toml`). (RF-005.3)
- **Não alterar** `src/lib/install.ts` — pipeline já implementa `alwaysApply` para `code-standards`. (decisão techspec)
- Executar `npm run build` e `npm test` — suite completa verde.
- Opcionalmente validar fixture de `tests/install.spec.ts` ou `tests/rule-to-mdc.spec.ts` com conteúdo expandido.
</requirements>

## Subtarefas

- [x] 5.1 Consolidar bloco `describe("code-standards.md")` — ≥ 15 seções, limites 50/10/4/3/300/15/6, classificação, exemplos TS/Java, ≤ 2.000 palavras.
- [x] 5.2 Consolidar bloco `describe("kspec-review-runner")` — referência obrigatória, SOLID, bloqueantes, formato de relatório, citação §.
- [x] 5.3 Consolidar bloco `describe("kspec-task-runner")` — etapa 7.5, limites, correção antes de entregar.
- [x] 5.4 Consolidar bloco `describe("kspec-implement")` — gate obrigatório de auto-verificação.
- [x] 5.5 Consolidar blocos `describe("kspec-bootstrap")` e `describe("templates")` — core obrigatório, brownfield, alwaysApply.
- [x] 5.6 Executar `npm run build && npm test` e corrigir regressões.
- [x] 5.7 Validar paridade: `rule-to-mdc.spec.ts` passa; opcionalmente verificar `.mdc` gerado com corpo expandido.

## Detalhes de Implementação

Ver `techspec.md` → "Abordagem de Testes" (lista completa de asserções) e "Pontos de Integração" (`ruleToMdc`, symlinks, `agent-toml`). Referência sem alteração: `src/lib/install.ts` linha 152 (`alwaysApply: name === "code-standards"`).

## Critérios de Sucesso

- `tests/clean-code-solid-coherence.spec.ts` cobre todos os artefatos modificados nas tarefas 1.0–4.0.
- `npm test` executa com sucesso (suite completa verde).
- `npm run build` executa com sucesso.
- Testes existentes em `rule-to-mdc.spec.ts` permanecem válidos.
- Após `kspec update` em fixture, `code-standards.mdc` contém corpo expandido e `alwaysApply: true` (validação opcional).

## Testes da Tarefa

- [x] Testes de unidade: suite `clean-code-solid-coherence.spec.ts` completa com todos os `describe` blocks.
- [x] Testes de integração: `npm test` (suite completa) + `npm run build`; opcionalmente `npm test -- install` ou `rule-to-mdc`.
- [ ] Testes E2E: validação manual recomendada — invocar `kspec-implement` em projeto de teste e verificar que review reprova função > 50 linhas com citação `§ Limites Mensuráveis`.

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `tests/clean-code-solid-coherence.spec.ts` — suite principal (novo).
- `tests/rule-to-mdc.spec.ts` — testes de conversão MDC (referência, sem alteração esperada).
- `tests/install.spec.ts` — fixture de distribuição (validação opcional).
- `tests/skills-coherence.spec.ts` — pode estender com asserções do gate Clean Code em `kspec-implement`.
- `src/lib/install.ts` — referência (`ruleToMdc`, `alwaysApply`); não alterar.
- `.cursor/rules/code-standards.mdc` — artefato derivado gerado no install/update.
