---
name: kspec-qa
description: Executa Quality Assurance da funcionalidade completa. Testa fluxos E2E com Playwright MCP, verifica acessibilidade (WCAG 2.2), documenta bugs em bugs.md e gera relatório qa.md. Execute após todas as tasks estarem implementadas e revisadas.
---

Delegue a execução ao agent `kspec-qa-runner` para rodar em contexto isolado — o QA produz output verboso que não deve consumir o contexto principal.

Passe ao agent:
- O caminho da funcionalidade: `@spec/tasks/[NNN]-prd-[nome-funcionalidade]/`
- O PRD, TechSpec e Tasks da funcionalidade

Após o agent concluir, apresente ao usuário:
- Status: APROVADO ou REPROVADO
- Quantidade de bugs encontrados (se houver)
- Caminho do relatório `qa.md`
- Se reprovado, sugira executar `/kspec-bugfix` para corrigir os bugs
