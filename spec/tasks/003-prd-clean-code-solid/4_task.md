# Tarefa 4.0: Integração no `kspec-bootstrap` e templates de guias

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Requisitos Atendidos

- REQ-004 — Integração no `kspec-bootstrap`

## Dependências

- 1.0

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Garantir que projetos-alvo recebam e reconheçam os padrões de Clean Code/SOLID desde a instalação via bootstrap. Atualizar templates de guias com seção explícita de rules e reforçar na skill `kspec-bootstrap` que `code-standards.md` é rule core obrigatória, sempre aplicável no Cursor, e que princípios universais são inegociáveis em projetos brownfield.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — rule core que o bootstrap deve validar e listar.
- `.agents/rules/logging.md` — mensagens de relatório final em pt-BR com causa + próxima ação.
</skills>

<requirements>
- Bootstrap deve confirmar presença de `code-standards.md` em `.agents/rules/` e listá-la como rule core obrigatória nos guias gerados. (RF-004.1)
- Documentar nos guias que `code-standards.md` é sempre aplicável (`alwaysApply: true` no Cursor) e não deve ser removida em brownfield. (RF-004.2)
- No passo brownfield (5.6), princípios universais de Clean Code/SOLID **não podem ser alterados** — apenas convenções de estilo são adaptáveis. (RF-004.3)
- Relatório final do bootstrap (passo 8) deve incluir linha confirmando instalação/validação de `code-standards.md`. (RF-004.4)
- Templates `claude-md-template.md` e `cursor-md-template.md` ganham seção "Rules — Padrões de Código" com `code-standards.md` e descrição "Clean Code, SOLID, limites mensuráveis". (RF-004.1, decisão techspec)
- Verificar se `agents-md-template.md` (Codex) também precisa da mesma seção para paridade tri-plataforma.
- Editar source of truth em `.agents/skills/kspec-bootstrap/SKILL.md` e `.agents/templates/`.
</requirements>

## Subtarefas

- [x] 4.1 Adicionar seção "Rules — Padrões de Código" em `claude-md-template.md` com `code-standards.md` obrigatória.
- [x] 4.2 Adicionar seção equivalente em `cursor-md-template.md` com `alwaysApply: true` explícito.
- [x] 4.3 Atualizar template Codex (`agents-md-template.md`) se existir, para paridade.
- [x] 4.4 Reforçar passo 5.4 do `kspec-bootstrap/SKILL.md` — validação de `code-standards.md` como core.
- [x] 4.5 Reforçar passo 5.6 (brownfield) — SOLID/Clean Code inegociáveis; apenas estilo adaptável.
- [x] 4.6 Incluir linha de validação de `code-standards.md` no relatório final (passo 8).

## Detalhes de Implementação

Ver `techspec.md` → "Arquitetura do Sistema" (templates) e `prd.md` → REQ-004. Arquivos alvo: `.agents/templates/claude-md-template.md`, `.agents/templates/cursor-md-template.md`, `.agents/skills/kspec-bootstrap/SKILL.md`.

## Critérios de Sucesso

- SKILL.md do bootstrap reforça RF-004.1 a RF-004.4.
- Templates listam `code-standards.md` com descrição "Clean Code, SOLID, limites mensuráveis".
- Seção brownfield explicita que SOLID/Clean Code são inegociáveis.
- Relatório final do bootstrap confirma validação da rule.

## Testes da Tarefa

- [x] Testes de unidade: adicionar blocos `describe("templates")` e `describe("kspec-bootstrap")` em `tests/clean-code-solid-coherence.spec.ts`.
- [x] Testes de integração: executar `npm test -- clean-code-solid-coherence` e confirmar que os blocos passam.
- [ ] Testes E2E: N/A nesta tarefa.

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/skills/kspec-bootstrap/SKILL.md` — source of truth da skill.
- `.agents/templates/claude-md-template.md` — template do guia Claude.
- `.agents/templates/cursor-md-template.md` — template do guia Cursor.
- `.agents/templates/agents-md-template.md` — template do guia Codex (se existir).
- `.agents/rules/code-standards.md` — rule referenciada (tarefa 1.0).
- `tests/clean-code-solid-coherence.spec.ts` — asserções de templates e bootstrap.
