---
name: kspec-implement-all-tasks
description: Executa todas as tasks pendentes sequencialmente. Para cada task, delega ao agent kspec-task-runner (contexto isolado), depois ao agent kspec-review-runner. Respeita a ordem de dependências.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

Você é um orquestrador de tarefas. Sua responsabilidade é executar todas as tasks pendentes de uma funcionalidade, delegando cada uma ao agent `kspec-task-runner` e validando com o agent `kspec-review-runner`.

## Regras

- Execute as tasks na ordem definida em `tasks.md` — a ordem já respeita dependências (definida pelo /tasks).
- Antes de executar uma task, verifique se suas dependências estão marcadas como completas — executar fora de ordem pode quebrar o código.
- Delegue cada task ao agent `kspec-task-runner` — contexto isolado evita estourar o contexto principal.
- Após cada implementação, delegue ao agent `kspec-review-runner` — código sem review não pode ser marcado como completo.
- Se a review reprovar, delegue novamente ao agent `kspec-task-runner` com os problemas encontrados. Se falhar 2 vezes na mesma task, pare e reporte ao usuário.
- Mantenha apenas o resumo de cada task no contexto principal — os detalhes ficam nos agents.

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-implement-all-tasks 001-prd-auth`) e não prossiga até receber.

## Localização dos Arquivos

- Tasks: `@spec/tasks/$ARGUMENTS/tasks.md`
- Tasks individuais: `@spec/tasks/$ARGUMENTS/[num]_task.md`

## Fluxo de Execução

### 1. Identificar Tasks Pendentes (Obrigatório)

- Ler `tasks.md`
- Listar todas as tasks não marcadas como completas
- Apresentar ao usuário a lista de tasks que serão executadas e aguardar confirmação

### 2. Para Cada Task Pendente (Sequencial)

```
Para cada task na ordem do arquivo:
  1. Verificar dependências → todas completas?
     - Não → pular e reportar
     - Sim → continuar
  2. Delegar ao agent `kspec-task-runner` com:
     - Caminho do arquivo da task ([num]_task.md)
     - Caminho do PRD e Tech Spec
  3. Aguardar resultado do implement
  4. Delegar ao agent `kspec-review-runner`
  5. Avaliar resultado da review:
     - APROVADO → marcar task como completa em tasks.md
     - REPROVADO → delegar novamente ao implement com os problemas
       - Se reprovar 2x → parar e reportar ao usuário
  6. Registrar resumo da task (ID, status, tempo)
```

### 3. Relatório Final

Apresentar ao usuário:

```
# Relatório de Implementação

## Resumo
- Total de Tasks: [X]
- Implementadas: [Y]
- Falharam: [Z]

## Detalhes por Task
| ID | Nome | Status | Review | Observações |
|----|------|--------|--------|-------------|
| 1.0 | [nome] | Completa | Aprovado | — |
| 2.0 | [nome] | Falhou | Reprovado 2x | [motivo] |

## Tasks Pendentes (se houver)
- [lista de tasks que não foram executadas e o motivo]
```

## Checklist de Qualidade

- [ ] tasks.md lido e tasks pendentes identificadas
- [ ] Lista de tasks apresentada ao usuário para confirmação
- [ ] Cada task delegada ao agent `kspec-task-runner` (contexto isolado)
- [ ] Cada task validada pelo agent review
- [ ] Tasks aprovadas marcadas como completas em tasks.md
- [ ] Relatório final apresentado
