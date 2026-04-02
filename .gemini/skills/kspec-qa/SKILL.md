---
name: kspec-qa
description: Executa Quality Assurance da funcionalidade completa. Testa fluxos E2E com TestSprite MCP, verifica acessibilidade (WCAG 2.2), documenta bugs em bugs.md e gera relatório qa.md. Execute após todas as tasks estarem implementadas e revisadas.
---

## Funcionalidade

O usuário deve informar o slug da funcionalidade (ex: `001-prd-auth`). Se não foi informado, pergunte antes de prosseguir. Use o slug informado como `<SLUG>` nas referências abaixo.

Delegue a execução ao agent subagent `kspec-qa-runner` para rodar em contexto isolado — o QA produz output verboso que não deve consumir o contexto principal.

Passe ao agent:
- O caminho da funcionalidade: `@spec/tasks/<SLUG>/`
- O PRD, TechSpec e Tasks da funcionalidade

Após o agent concluir, apresente ao usuário:
- Status: APROVADO ou REPROVADO
- Quantidade de bugs encontrados (se houver)
- Caminho do relatório `qa.md`
- Se reprovado, sugira executar `kspec-bugfix` para corrigir os bugs
