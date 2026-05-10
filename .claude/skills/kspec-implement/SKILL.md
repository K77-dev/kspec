---
name: kspec-implement
version: 1.0.0
description: Executa todas as tasks pendentes (sequencial ou paralelo). Para cada task, delega ao agent kspec-task-runner (contexto isolado), depois ao agent kspec-review-runner. Respeita dependências e oferece paralelismo quando possível.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-implement**

Você é um orquestrador de tarefas. Sua responsabilidade é executar todas as tasks pendentes de uma funcionalidade, delegando cada uma ao agent `kspec-task-runner` e validando com o agent `kspec-review-runner`.

## Regras

- Execute as tasks na ordem definida em `tasks.md` — a ordem já respeita dependências (definida pelo /tasks).
- Antes de executar uma task, verifique se suas dependências estão marcadas como completas — executar fora de ordem pode quebrar o código.
- Delegue cada task ao agent `kspec-task-runner` — contexto isolado evita estourar o contexto principal.
- Após cada implementação, delegue ao agent `kspec-review-runner` — código sem review não pode ser marcado como completo.
- Se a review retornar **APROVADO COM RESSALVAS**, gere um diagnóstico estruturado (mesmo formato do Diagnóstico de Causa Raiz) listando cada ressalva como problema a corrigir, e delegue uma única vez ao `kspec-task-runner` com o diagnóstico. Se ainda tiver ressalvas após a correção, reporte ao usuário.
- Se a review **REPROVAR**, gere um diagnóstico de causa raiz estruturado e delegue uma única vez ao `kspec-task-runner` com o diagnóstico. Se continuar reprovado após a correção, reporte ao usuário.
- Mantenha apenas o resumo de cada task no contexto principal — os detalhes ficam nos agents.

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-implement 001-prd-auth`) e não prossiga até receber.

## Localização dos Arquivos

- Tasks: `@spec/tasks/$ARGUMENTS/tasks.md`
- Tasks individuais: `@spec/tasks/$ARGUMENTS/[num]_task.md`

## Fluxo de Execução

### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.

### 1. Identificar Tasks Pendentes (Obrigatório)

- Ler `tasks.md`
- Listar todas as tasks não marcadas como completas
- Analisar dependências de cada task (formato `depende: X.0, Y.0`)
- Agrupar tasks em lotes para execução paralela:
  - **Lote 1**: tasks sem dependências pendentes
  - **Lote 2**: tasks que dependem do Lote 1
  - **Lote N**: tasks que dependem dos lotes anteriores
- Se todas as tasks tiverem dependências entre si (nenhum lote com múltiplas tasks), executar sequencial
- Apresentar ao usuário a lista de tasks (com lotes se houver paralelismo) e aguardar confirmação

### 2. Executar Tasks

#### Modo Paralelo (padrão quando possível)

```
Agrupar tasks pendentes em lotes por dependência:
  Lote 1: tasks sem dependências pendentes → executar em paralelo
  Lote 2: tasks que dependem do Lote 1 → aguardar Lote 1, depois executar em paralelo
  ...

Para cada lote:
  0. Para cada task do lote, verificar se existe review_X.0.md com status REPROVADO
     - Se sim → gerar diagnóstico de causa raiz (ver formato abaixo) para incluir na delegação
  1. Delegar TODAS as tasks do lote ao agent `kspec-task-runner` em paralelo
     - Se retry: incluir diagnóstico de causa raiz + instrução "Este é um retry. NÃO repita a abordagem anterior."
  2. Aguardar todos os resultados
  3. Para cada task concluída, delegar ao agent `kspec-review-runner` com slug da funcionalidade ($ARGUMENTS) + contexto da task
  4. Avaliar resultados:
     - APROVADO → marcar task como completa em tasks.md
     - APROVADO COM RESSALVAS → gerar diagnóstico de causa raiz (ver formato abaixo) listando cada ressalva como problema a corrigir, e delegar uma única vez (sequencial) com o diagnóstico estruturado
       - Se ainda tiver ressalvas após correção → parar e reportar ao usuário
     - REPROVADO → gerar diagnóstico de causa raiz (ver formato abaixo) e delegar uma única vez (sequencial) com o diagnóstico estruturado
       - Se continuar reprovado → parar e reportar ao usuário
  5. Só avançar para o próximo lote quando TODAS as tasks do lote atual estiverem completas
```

#### Modo Sequencial (fallback quando paralelismo não é possível)

```
Para cada task na ordem do arquivo:
  1. Verificar dependências → todas completas?
     - Não → pular e reportar
     - Sim → continuar
  1.5. Verificar se existe review_X.0.md para esta task
     - Se existir e status REPROVADO → gerar diagnóstico de causa raiz (ver formato abaixo) e incluir na delegação
  2. Delegar ao agent `kspec-task-runner` com:
     - Caminho do arquivo da task ([num]_task.md)
     - Caminho do PRD e Tech Spec
     - Se retry: diagnóstico de causa raiz + instrução "Este é um retry. NÃO repita a abordagem anterior."
  3. Aguardar resultado do implement
  4. Delegar ao agent `kspec-review-runner` com slug da funcionalidade ($ARGUMENTS) + contexto da task
  5. Avaliar resultado da review:
     - APROVADO → marcar task como completa em tasks.md
     - APROVADO COM RESSALVAS → gerar diagnóstico de causa raiz (ver formato abaixo) listando cada ressalva como problema a corrigir, e delegar uma única vez ao implement com o diagnóstico estruturado
       - Se ainda tiver ressalvas após correção → parar e reportar ao usuário
     - REPROVADO → gerar diagnóstico de causa raiz (ver formato abaixo) e delegar uma única vez ao implement com o diagnóstico estruturado
       - Se continuar reprovado → parar e reportar ao usuário
  6. Registrar resumo da task (ID, status, tempo)
```

#### Formato do Diagnóstico de Causa Raiz (para retry)

Ao detectar review anterior reprovado, ler o review report e o código atual, e gerar:

```
## Diagnóstico de Causa Raiz

### Problemas do Review Anterior
Para cada problema do review, classificar:
- **Tipo**: código errado | código faltando | teste faltando | teste errado | violação de rule | divergência da spec
- **Arquivo**: caminho do arquivo afetado
- **O que foi feito**: o que o task-runner implementou na tentativa anterior
- **Por que falhou**: análise de por que a abordagem não funcionou
- **Correção necessária**: instrução específica e assertiva do que fazer diferente

### Abordagem Anterior (o que NÃO repetir)
- Resumo da abordagem que falhou e por que não deve ser repetida

### Nova Abordagem Recomendada
- Estratégia diferente para resolver os problemas
- Se o problema for de entendimento da spec, citar o trecho relevante da spec
- Se for de padrão de código, citar a rule específica e o exemplo correto
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
| 2.0 | [nome] | Completa | Aprovado com Ressalvas → Aprovado | review_2.0.md | Ressalvas corrigidas na delegação |
| 3.0 | [nome] | Falhou | Reprovado ou com Ressalvas | review_3.0.md | [lista resumida dos problemas não resolvidos] |

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
