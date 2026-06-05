# Tarefa 4.0: Detecção de migração e sumário de instalação para Cursor

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 2.0 (o sumário consome o `InstallReport` estendido; a migração inspeciona a estrutura `.cursor/`)

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Estender `detectMigration` para inspecionar `.cursor/` (subdirs esperados como symlink: `skills`, `agents`, `templates`, `validation` — excluindo `.cursor/rules`, que é diretório real derivado legítimo) e estender `printInstallSummary` para reportar os artefatos Cursor gerados.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — extensão coerente das funções existentes.
- `.agents/rules/logging.md` — saída pt-BR `→/✓/⚠/✗` no sumário e no plano de migração.
</skills>

<requirements>
- `detectMigration` inspeciona `.cursor/` para subdirs esperados como symlink (`skills`, `agents`, `templates`, `validation`); `.cursor/rules` é **excluído** da detecção. (RF3.3)
- Plano de migração e confirmação quando detectar diretórios reais com conteúdo local. (RF3.3)
- `printInstallSummary` reporta `linkedCursorSkills`, `linkedCursorAgents`, `generatedMdc`.
- Não alterar `settings.json`/`settings.local.json` (já garantido por `PRESERVED_FILES`).
</requirements>

## Subtarefas

- [ ] 4.1 Estender `detectMigration` em `src/lib/migration.ts` para `.cursor/` (excluindo `rules`).
- [ ] 4.2 Estender `printInstallSummary` em `src/utils/output.ts` para artefatos Cursor.
- [ ] 4.3 Testes unitários de detecção e de sumário.

## Detalhes de Implementação

Ver `techspec.md` → "Arquitetura do Sistema → Componentes modificados" (`migration.ts`, `output.ts`) e "Abordagem de Testes → Testes Unidade" (`detectMigration`: `.cursor/skills` real dispara plano; `.cursor/rules` real **não** dispara).

## Critérios de Sucesso

- `.cursor/skills` como diretório real dispara plano de migração; `.cursor/rules` real não dispara.
- Sumário de instalação lista skills, agents e `.mdc` Cursor.

## Testes da Tarefa

- [ ] Testes de unidade:
  - `detectMigration`: `.cursor/skills` dir real → plano; `.cursor/rules` real → sem plano.
  - `printInstallSummary` inclui contagens Cursor.
- [ ] Testes de integração (idempotência/estrutura coberta na 6.0)
- [ ] Testes E2E (N/A)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `src/lib/migration.ts` — `detectMigration` estendida.
- `src/utils/output.ts` — `printInstallSummary` estendida.
- Testes Vitest correspondentes.
