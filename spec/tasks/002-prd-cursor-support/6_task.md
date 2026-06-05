# Tarefa 6.0: Smoke test + prepublish-check tri-plataforma

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 2.0, 3.0, 4.0, 5.0 (a validação cobre estrutura `.cursor/`, `CURSOR.md`, migração e distribuição)

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Estender os scripts de validação (`scripts/smoke.sh` e `scripts/prepublish-check.sh`) para cobrir a camada Cursor: contagem de symlinks de skills/agents, geração de `.mdc`, presença de `CURSOR.md`, idempotência do `update` e integridade dos symlinks no tarball.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — scripts legíveis e determinísticos.
- `.agents/rules/logging.md` — saída pt-BR `→/✓/⚠/✗`.
</skills>

<requirements>
- `smoke.sh` Cenário 1 com asserts:
  - `find .cursor/skills -maxdepth 1 -type l ≥ 11`.
  - `find .cursor/agents -maxdepth 1 -type l ≥ 3`.
  - contagem de `.cursor/rules/*.mdc` ≥ contagem de `.agents/rules/*.md` resolvíveis.
  - `CURSOR.md` existe; `code-standards.mdc` contém `alwaysApply: true`.
- `smoke.sh` Cenário 3 (idempotência) abrange `.cursor/` (symlinks + `.mdc` inalterados em 2º `update`).
- `prepublish-check.sh` valida symlinks de `.cursor/skills`, `.cursor/agents`, `.cursor/templates`, `.cursor/validation` (excluir `.cursor/rules`).
- Zero regressão nos asserts existentes de Claude/Codex.
</requirements>

## Subtarefas

- [ ] 6.1 Estender Cenário 1 de `smoke.sh` com asserts Cursor.
- [ ] 6.2 Estender Cenário 3 (idempotência) de `smoke.sh` para `.cursor/`.
- [ ] 6.3 Estender `prepublish-check.sh` para symlinks Cursor (exceto `rules`).
- [ ] 6.4 Executar ambos os scripts e garantir sucesso.

## Detalhes de Implementação

Ver `techspec.md` → "Abordagem de Testes → Testes de Integração" (lista de asserts) e "Monitoramento → Health Checks".

## Critérios de Sucesso

- `smoke.sh` passa com os novos asserts Cursor e idempotência.
- `prepublish-check.sh` confirma que todos os symlinks Cursor (exceto `rules`) resolvem para `.agents/`.
- Nenhuma regressão nos cenários Claude/Codex.

## Testes da Tarefa

- [ ] Testes de unidade (N/A — scripts shell)
- [ ] Testes de integração: execução de `scripts/smoke.sh` e `scripts/prepublish-check.sh` com sucesso.
- [ ] Testes E2E (manual, ver task 8.0)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `scripts/smoke.sh` — cenários 1 e 3 estendidos.
- `scripts/prepublish-check.sh` — validação de symlinks Cursor.
