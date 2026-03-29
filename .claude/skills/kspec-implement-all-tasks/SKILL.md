---
name: kspec-implement-all-tasks
description: Executa todas as tasks pendentes (sequencial ou paralelo). Para cada task, delega ao agent kspec-task-runner (contexto isolado), depois ao agent kspec-review-runner. Respeita dependências e oferece paralelismo quando possível.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

Você é um orquestrador de tarefas. Sua responsabilidade é executar todas as tasks pendentes de uma funcionalidade, delegando cada uma ao agent `kspec-task-runner` e validando com o agent `kspec-review-runner`.

## Regras

- Execute as tasks na ordem definida em `tasks.md` — a ordem já respeita dependências (definida pelo /tasks).
- Antes de executar uma task, verifique se suas dependências estão marcadas como completas — executar fora de ordem pode quebrar o código.
- Delegue cada task ao agent `kspec-task-runner` — contexto isolado evita estourar o contexto principal.
- Após cada implementação, delegue ao agent `kspec-review-runner` — código sem review não pode ser marcado como completo.
- Se a review retornar **APROVADO COM RESSALVAS**, delegue novamente ao `kspec-task-runner` com as ressalvas para correção. Se após correção ainda tiver ressalvas ou reprovar, pare e reporte ao usuário.
- Se a review **REPROVAR**, delegue novamente ao `kspec-task-runner` com os problemas. Se reprovar 2x na mesma task, pare e reporte ao usuário com a lista de problemas não resolvidos.
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
- Analisar dependências de cada task (formato `depende: X.0, Y.0`)
- Identificar tasks que podem ser executadas em paralelo (dependências já completas e sem conflito entre si)
- Se houver oportunidade de paralelismo, perguntar ao usuário usando AskUserQuestion:
  - "As seguintes tasks podem ser executadas em paralelo: [lista]. Deseja execução paralela ou sequencial?"
  - Se o usuário escolher sequencial, executar na ordem do arquivo
  - Se o usuário escolher paralelo, agrupar tasks independentes em lotes
- Apresentar ao usuário a lista de tasks (com ordem/lotes) e aguardar confirmação

### 2. Executar Tasks

#### Modo Sequencial (padrão)

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
     - APROVADO COM RESSALVAS → delegar novamente ao implement com as ressalvas
       - Se após correção ainda tiver ressalvas ou reprovar → parar e reportar ao usuário
     - REPROVADO → delegar novamente ao implement com os problemas
       - Se reprovar 2x → parar e reportar ao usuário com lista de problemas não resolvidos
  6. Registrar resumo da task (ID, status, tempo)
```

#### Modo Paralelo (quando autorizado pelo usuário)

```
Agrupar tasks pendentes em lotes por dependência:
  Lote 1: tasks sem dependências pendentes → executar em paralelo
  Lote 2: tasks que dependem do Lote 1 → aguardar Lote 1, depois executar em paralelo
  ...

Para cada lote:
  1. Delegar TODAS as tasks do lote ao agent `kspec-task-runner` em paralelo
  2. Aguardar todos os resultados
  3. Para cada task concluída, delegar ao agent `kspec-review-runner`
  4. Avaliar resultados:
     - APROVADO → marcar task como completa em tasks.md
     - APROVADO COM RESSALVAS → delegar novamente (sequencial) com as ressalvas
       - Se após correção ainda tiver ressalvas ou reprovar → parar e reportar ao usuário
     - REPROVADO → delegar novamente (sequencial) com os problemas
       - Se reprovar 2x → parar e reportar ao usuário com lista de problemas não resolvidos
  5. Só avançar para o próximo lote quando TODAS as tasks do lote atual estiverem completas
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
| ID | Nome | Status | Review | Arquivo Review | Ressalvas/Problemas |
|----|------|--------|--------|----------------|---------------------|
| 1.0 | [nome] | Completa | Aprovado | review_1.0.md | — |
| 2.0 | [nome] | Completa | Aprovado com Ressalvas → Aprovado | review_2.0.md | Ressalvas corrigidas na 2ª tentativa |
| 3.0 | [nome] | Falhou | Reprovado 2x | review_3.0.md | [lista resumida dos problemas não resolvidos] |

## Reviews com Ressalvas (se houver)
Para cada task que teve ressalvas (corrigidas ou não), listar:
- **Task [ID]**: [resumo das ressalvas encontradas] — Status final: [corrigido/pendente]

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
