---
name: kspec-qa
version: 1.0.0
description: Executa Quality Assurance da funcionalidade completa. Testa fluxos E2E com TestSprite MCP, verifica acessibilidade (WCAG 2.2), documenta bugs em bugs.md e gera relatório qa.md. Execute após todas as tasks estarem implementadas e revisadas.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-qa**

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-qa 001-prd-auth`) e não prossiga até receber.

### 0. Validação de Skills Empresariais (Obrigatório)

**Pré-requisito — arquivo de validação presente:**

Verifique se `.agents/validation/enterprise-skills-check.md` existe e tem ao menos 100 linhas:

```bash
test -f .agents/validation/enterprise-skills-check.md && [ "$(wc -l < .agents/validation/enterprise-skills-check.md)" -ge 100 ]
```

Se faltar ou estiver truncado, o kspec foi instalado de forma incompleta. Reporte ao usuário:

`✗ Arquivo de validação ausente/corrompido. Execute 'npx @k77-dev/kspec install' na raiz do projeto e tente novamente.`

e BLOQUEIE a execução. NÃO tente baixar via `gh api` ou `git clone` — o caminho canônico de distribuição do kspec é o pacote npm.

**Validação propriamente dita:**

Siga as instruções em `@.agents/validation/enterprise-skills-check.md` para validar e instalar as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação bloquear a execução.

## Delegação de Agents

Delegue a execução ao agent `kspec-qa-runner` para rodar em contexto isolado — o QA produz output verboso que não deve consumir o contexto principal.

| Agent | `subagent_type` (Cursor) |
| --- | --- |
| `kspec-qa-runner` | `kspec-qa-runner` |

**Cursor — Task tool:**

```
Task tool → subagent_type: "kspec-qa-runner"
prompt: caminho da funcionalidade, PRD, Tech Spec e Tasks
```

**Fallback (Task tool indisponível):** execute a lógica do agent inline no contexto principal e exiba:

```
⚠ Task tool indisponível — executando kspec-qa-runner inline no contexto principal.
```

Agents residem em `.agents/agents/<nome>/AGENT.md` (source of truth).

No Cursor, discovery reforçado via `.cursor/agents/` (symlink) e `.agents/agents/`.

Passe ao agent (via Task tool ou inline):
- O caminho da funcionalidade: `@spec/tasks/$ARGUMENTS/`
- O PRD, TechSpec e Tasks da funcionalidade

Após o agent concluir, apresente ao usuário:
- Status: APROVADO ou REPROVADO
- Quantidade de bugs encontrados (se houver)
- Caminho do relatório `qa.md`
- Se reprovado, sugira executar `/kspec-bugfix` para corrigir os bugs
