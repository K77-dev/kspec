---
name: kspec-implement-task
version: 1.0.0
description: Implementa a próxima tarefa de desenvolvimento disponível. Delega ao agent kspec-task-runner (contexto isolado), depois ao agent kspec-review-runner. Uso manual, uma task por vez.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-implement-task**

Você é um orquestrador de tarefas. Sua responsabilidade é identificar a próxima task pendente, delegar a implementação ao agent `kspec-task-runner` e validar com o agent `kspec-review-runner`.

## Regras

- Delegue a implementação ao agent `kspec-task-runner` — contexto isolado evita estourar o contexto principal.
- Após cada implementação, delegue ao agent `kspec-review-runner` — código sem review não pode ser marcado como completo.
- Se a review retornar **APROVADO COM RESSALVAS**, gere um diagnóstico estruturado (mesmo formato do passo 1.5) listando cada ressalva como problema a corrigir, e delegue novamente ao `kspec-task-runner` com o diagnóstico. Se após correção ainda tiver ressalvas ou reprovar, pare e reporte ao usuário.
- Se a review **REPROVAR**, gere um diagnóstico de causa raiz estruturado e delegue novamente ao `kspec-task-runner` com o diagnóstico. Se reprovar 2x, pare e reporte ao usuário com a lista de problemas não resolvidos.
- Marque a tarefa como completa em tasks.md após a review passar.

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-implement-task 001-prd-auth`) e não prossiga até receber.

## Localização dos Arquivos

- PRD: `@spec/tasks/$ARGUMENTS/prd.md`
- Tech Spec: `@spec/tasks/$ARGUMENTS/techspec.md`
- Tasks: `@spec/tasks/$ARGUMENTS/tasks.md`
- Regras do Projeto: @.claude/rules

## Etapas para Executar

### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.

### 1. Identificar Próxima Task Pendente (Obrigatório)

- Ler `tasks.md`
- Identificar a primeira task não marcada como completa
- Verificar se suas dependências estão completas
  - Se não estiverem → reportar ao usuário e parar
- Verificar se existe `review_X.0.md` para esta task em `spec/tasks/$ARGUMENTS/`
  - Se existir e o status for **REPROVADO** → ativar modo de retry com diagnóstico (passo 1.5)
  - Se não existir → prosseguir normalmente para o passo 2

### 1.5. Diagnóstico de Causa Raiz (Condicional — só se review anterior REPROVADO)

Ler o review report reprovado e o código atual da task. Gerar o seguinte diagnóstico estruturado:

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

### 2. Delegar Implementação (Obrigatório)

Delegar ao agent `kspec-task-runner` com:
- Caminho do arquivo da task (`[num]_task.md`)
- Caminho do PRD e Tech Spec
- **Se modo de retry ativo**: incluir o diagnóstico estruturado do passo 1.5 e a instrução: "Este é um retry. O diagnóstico abaixo mostra o que falhou e o que fazer diferente. NÃO repita a abordagem anterior."

Aguardar resultado da implementação.

### 3. Delegar Review (Obrigatório)

Delegar ao agent `kspec-review-runner` com:
- **Slug da funcionalidade: $ARGUMENTS**
- Contexto da task implementada

Avaliar resultado da review:
- **APROVADO** → prosseguir para o passo 4
- **APROVADO COM RESSALVAS** → gerar diagnóstico (mesmo formato do passo 1.5) listando cada ressalva como problema a corrigir, e delegar novamente ao `kspec-task-runner` com o diagnóstico estruturado completo
  - Se após correção a review ainda tiver ressalvas ou reprovar → parar e reportar ao usuário
- **REPROVADO** → gerar diagnóstico de causa raiz (mesmo formato do passo 1.5) com base no review report e no código atual, e delegar novamente ao `kspec-task-runner` com o diagnóstico estruturado completo
  - Se reprovar 2x → parar e reportar ao usuário com a lista dos problemas não resolvidos

### 4. Finalizar (Obrigatório)

- Marcar a task como completa em `tasks.md`
- Apresentar resumo ao usuário:
  - ID e nome da task
  - Status final da review (Aprovado / Aprovado com Ressalvas → Aprovado / Reprovado)
  - Arquivo da review gerado (ex: `review_1.0.md`)
  - Se houve ressalvas: resumo do que foi encontrado e se foi corrigido

## Checklist de Qualidade

- [ ] tasks.md lido e próxima task pendente identificada
- [ ] Dependências da task verificadas
- [ ] Task delegada ao agent `kspec-task-runner` (contexto isolado)
- [ ] Task validada pelo agent `kspec-review-runner`
- [ ] Task aprovada marcada como completa em tasks.md
- [ ] Resumo apresentado ao usuário
