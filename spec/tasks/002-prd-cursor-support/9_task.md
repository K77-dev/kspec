# Tarefa 9.0: Documentação tri-plataforma (`README.md`, `AGENTS.md`, `CLAUDE.md`)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 3.0 (coerência com `CURSOR.md`)
- 7.0 (comportamento final do bootstrap tri-plataforma)
- 8.0 (comportamento final das skills/agents no Cursor)

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Atualizar a documentação para refletir o Cursor como terceira plataforma: README com "Matriz de plataformas" (coluna Cursor), e `AGENTS.md`/`CLAUDE.md` com as limitações específicas de cada plataforma. Garantir coerência entre os três docs raiz.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — consistência documental.
- `.agents/rules/logging.md` — N/A (documentação).
</skills>

<requirements>
- README contém "Matriz de plataformas" com coluna Cursor (skills, agents, rules, invocação). (RF6.1)
- `AGENTS.md`, `CLAUDE.md` e `CURSOR.md` listam limitações específicas de cada plataforma. (RF6.2)
- README referencia as três plataformas com tabela comparativa de invocação e discovery paths.
- Release notes mencionam Cursor como nova plataforma suportada.
- RF6.4 é N/A nesta release (sem novas skills empresariais → não tocar `enterprise-skills-lock.json`).
</requirements>

## Subtarefas

- [ ] 9.1 Atualizar README com a matriz de plataformas (coluna Cursor) e discovery paths.
- [ ] 9.2 Atualizar `AGENTS.md` e `CLAUDE.md` com limitações por plataforma e coerência com `CURSOR.md`.
- [ ] 9.3 Adicionar release notes mencionando o Cursor.

## Detalhes de Implementação

Ver `prd.md` → REQ-006 e `techspec.md` → "Arquivos relevantes e dependentes".

## Critérios de Sucesso

- README referencia as três plataformas com tabela comparativa de invocação e discovery paths.
- `AGENTS.md`/`CLAUDE.md`/`CURSOR.md` coerentes (mesma descrição/paths) e com limitações por plataforma.
- Release notes mencionam o Cursor.

## Testes da Tarefa

- [ ] Testes de unidade (N/A — documentação)
- [ ] Testes de integração: revisão de coerência cruzada entre README, `AGENTS.md`, `CLAUDE.md` e `CURSOR.md`.
- [ ] Testes E2E (N/A)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `README.md` — matriz de plataformas.
- `AGENTS.md`, `CLAUDE.md` — limitações por plataforma.
- `CURSOR.md` — coerência cruzada.
