# Tarefa 3.0: `CURSOR.md` + `cursor-md-template.md` + extensão de `ensureRootDocs`

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 2.0 (`ensureRootDocs` vive em `install.ts` e usa os resolvedores/relatório da camada Cursor)

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Criar o template `cursor-md-template.md` em `.agents/templates/` e o `CURSOR.md` na raiz (equivalente a `CLAUDE.md`/`AGENTS.md`), e estender `ensureRootDocs` para materializá-lo durante `runInstall` (sem sobrescrever docs finais existentes).

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — alteração mínima e coerente em `ensureRootDocs`.
- `.agents/rules/logging.md` — saída pt-BR ao gerar o doc.
</skills>

<requirements>
- `CURSOR.md` lista cada skill com forma de invocação no Cursor (linguagem natural ou menção explícita). (RF2.1)
- Documenta delegação de agents via Task tool (`subagent_type`: `kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`). (RF2.2)
- Referencia rules por caminho canônico (`.agents/rules/`) e publicação Cursor (`.cursor/rules/*.mdc`). (RF2.3)
- Seção "Limitações conhecidas no Cursor": sem slash commands de projeto, delegação via Task tool, rules derivadas, Windows, MCP opt-in. (RF2.4)
- Documenta `AskQuestion` como equivalente a `AskUserQuestion` (Claude) / `request_user_input` (Codex). (RF2.5)
- Coerência de descrição e paths com `CLAUDE.md` e `AGENTS.md`. (RF2.6)
- Template `cursor-md-template.md` disponível em `.agents/templates/`.
- `ensureRootDocs` materializa `CURSOR.md` sem sobrescrever doc final existente (`pathExists` guard).
</requirements>

## Subtarefas

- [ ] 3.1 Criar `.agents/templates/cursor-md-template.md`.
- [ ] 3.2 Gerar `CURSOR.md` na raiz a partir do template.
- [ ] 3.3 Estender `ensureRootDocs` para incluir `CURSOR.md` (com guard de não sobrescrever).
- [ ] 3.4 Testes/validação de geração do doc.

## Detalhes de Implementação

Ver `techspec.md` → "Arquitetura do Sistema → Componentes novos" e "Design de Implementação". Reusar o padrão de `ensureRootDocs` já existente para `CLAUDE.md`/`AGENTS.md`.

## Critérios de Sucesso

- `CURSOR.md` existe após `kspec init` e é coerente com `CLAUDE.md`/`AGENTS.md`.
- Template `cursor-md-template.md` presente em `.agents/templates/`.
- `ensureRootDocs` não sobrescreve `CURSOR.md` final existente.

## Testes da Tarefa

- [ ] Testes de unidade: `ensureRootDocs` cria `CURSOR.md` quando ausente; não sobrescreve quando presente.
- [ ] Testes de integração (presença de `CURSOR.md` coberta na 6.0)
- [ ] Testes E2E (N/A)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/templates/cursor-md-template.md` — novo template.
- `CURSOR.md` — doc raiz.
- `src/lib/install.ts` — `ensureRootDocs` estendida.
- `src/utils/paths.ts` — `getCursorMdSource()` (definido na 2.0).
