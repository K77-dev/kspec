# Tarefa 3.0: Enforcement no `kspec-task-runner` e gate no `kspec-implement`

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Requisitos Atendidos

- REQ-003 — Enforcement no `kspec-task-runner` e `kspec-implement`

## Dependências

- 1.0, 2.0

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Garantir que Clean Code e SOLID sejam aplicados **durante** a implementação, não apenas no review posterior. O `kspec-task-runner` ganha etapa 7.5 de auto-verificação (antes da verificação de testes) alinhada aos critérios do review-runner; a skill `kspec-implement` declara essa verificação como gate obrigatório de conclusão de task.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — limites mensuráveis (50 linhas, complexidade 10, 4 parâmetros).
- Alinhar critérios com `kspec-review-runner` (tarefa 2.0) para evitar divergência implementação × review.
</skills>

<requirements>
- `kspec-task-runner` deve ler `code-standards.md` na etapa de análise e incluir princípios relevantes ao escopo no resumo pré-implementação. (RF-003.1)
- Adicionar etapa 7.5 "Verificação Clean Code/SOLID" **antes** da verificação final de testes. (RF-003.2, decisão techspec)
- Auto-verificar: nomenclatura, ausência de funções longas, SRP em novos módulos, tratamento de erros e ausência de duplicação óbvia. (RF-003.2)
- Referenciar limites mensuráveis: 50 linhas, complexidade 10, 4 parâmetros. (RF-003.2)
- Em violações detectadas, corrigir antes de entregar — não delegar ao review. (RF-003.4)
- `kspec-implement` deve instruir que nenhuma task é concluída sem passar pela auto-verificação do task-runner. (RF-003.3)
- Editar `.agents/agents/kspec-task-runner/AGENT.md` e `.agents/skills/kspec-implement/SKILL.md`.
</requirements>

## Subtarefas

- [x] 3.1 Incluir leitura de `code-standards.md` na etapa 2 (Análise da Tarefa) com resumo dos princípios aplicáveis ao escopo.
- [x] 3.2 Criar etapa 7.5 "Verificação Clean Code/SOLID" entre implementação e verificação de testes.
- [x] 3.3 Documentar checklist de auto-verificação com limites 50/10/4 e instrução de corrigir violações antes de entregar.
- [x] 3.4 Atualizar `kspec-implement/SKILL.md` com gate obrigatório de auto-verificação antes de marcar task como completa.
- [x] 3.5 Garantir alinhamento dos critérios bloqueantes com os definidos no review-runner (tarefa 2.0).

## Detalhes de Implementação

Ver `techspec.md` → "Sequenciamento de Desenvolvimento" (etapa 7.5 antes de testes) e `prd.md` → REQ-003. Arquivos alvo: `.agents/agents/kspec-task-runner/AGENT.md`, `.agents/skills/kspec-implement/SKILL.md`.

## Critérios de Sucesso

- AGENT.md do task-runner inclui etapa explícita "Verificação Clean Code/SOLID" (7.5) antes da conclusão.
- Instruções referenciam limites 50 linhas, complexidade 10 e 4 parâmetros.
- Violações devem ser corrigidas pelo agent antes de entregar (não delegar ao review).
- SKILL.md do `kspec-implement` menciona auto-verificação como gate obrigatório.

## Testes da Tarefa

- [x] Testes de unidade: adicionar blocos `describe("kspec-task-runner")` e `describe("kspec-implement")` em `tests/clean-code-solid-coherence.spec.ts`.
- [x] Testes de integração: executar `npm test -- clean-code-solid-coherence` e confirmar que ambos os blocos passam.
- [x] Testes E2E: N/A nesta tarefa.

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/agents/kspec-task-runner/AGENT.md` — source of truth do agent.
- `.agents/skills/kspec-implement/SKILL.md` — source of truth da skill.
- `.agents/agents/kspec-review-runner/AGENT.md` — referência de critérios (tarefa 2.0).
- `.agents/rules/code-standards.md` — rule referenciada (tarefa 1.0).
- `tests/clean-code-solid-coherence.spec.ts` — asserções dos dois artefatos.
- `.codex/agents/kspec-task-runner.toml` — artefato derivado (não editar diretamente).
