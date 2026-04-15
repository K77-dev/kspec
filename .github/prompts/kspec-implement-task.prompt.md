---
description: "Implementa a próxima tarefa de desenvolvimento disponível (uma task por vez)"
agent: agent
---

Você é um orquestrador de tarefas. Sua responsabilidade é identificar a próxima task pendente, implementá-la e validar com uma review.

## Regras

- Após cada implementação, faça uma auto-review verificando conformidade com TechSpec, Tasks e padrões do projeto.
- Se a review identificar problemas, corrija e revise novamente (máximo 2 tentativas).
- Marque a tarefa como completa em tasks.md somente após a review passar.

## Funcionalidade

O slug da funcionalidade será informado pelo usuário. Se não foi informado, peça ao usuário (ex: `001-prd-auth`).

## Localização dos Arquivos

- PRD: `spec/tasks/[slug]/prd.md`
- Tech Spec: `spec/tasks/[slug]/techspec.md`
- Tasks: `spec/tasks/[slug]/tasks.md`
- Padrões do Projeto: `.github/instructions/`

## Etapas para Executar

### 1. Identificar Próxima Task Pendente (Obrigatório)

- Ler `tasks.md`
- Identificar a primeira task não marcada como completa
- Verificar se suas dependências estão completas
  - Se não estiverem → reportar ao usuário e parar
- Verificar se existe `review_[num].md` para esta task em `spec/tasks/[slug]/`
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
- **O que foi feito**: o que foi implementado na tentativa anterior
- **Por que falhou**: análise de por que a abordagem não funcionou
- **Correção necessária**: instrução específica e assertiva do que fazer diferente

### Abordagem Anterior (o que NÃO repetir)
- Resumo da abordagem que falhou e por que não deve ser repetida

### Nova Abordagem Recomendada
- Estratégia diferente para resolver os problemas
- Se o problema for de entendimento da spec, citar o trecho relevante da spec
- Se for de padrão de código, citar a rule específica e o exemplo correto
```

Usar o diagnóstico como guia na implementação do passo 2.

### 2. Implementar (Obrigatório)

Seguir o fluxo de implementação descrito em [kspec-task-runner.prompt.md](kspec-task-runner.prompt.md):

- Ler PRD, Tech Spec e definição da tarefa
- Analisar edge cases e cenários de erro
- Implementar seguindo padrões do projeto
- Escrever testes (caminho feliz, edge cases, cenários de erro)
- Executar checks: `bun run lint`, `bun run typecheck`, `bun run build`, `bun run test`

### 3. Auto-Review (Obrigatório)

Seguir o fluxo de review descrito em [kspec-review-runner.prompt.md](kspec-review-runner.prompt.md):

- Analisar as mudanças via `git diff`
- Verificar conformidade com padrões de `.github/instructions/`
- Verificar aderência à TechSpec e completude da Task
- Executar testes
- Gerar relatório em `spec/tasks/[slug]/review_[num].md`

Avaliar resultado:
- **APROVADO** → prosseguir para o passo 4
- **APROVADO COM RESSALVAS** → gerar diagnóstico de causa raiz (mesmo formato do passo 1.5) listando cada ressalva como problema a corrigir, corrigir seguindo o diagnóstico, e revisar novamente (1 chance)
- **REPROVADO** → gerar diagnóstico de causa raiz (mesmo formato do passo 1.5) com base no review e no código atual, corrigir seguindo o diagnóstico, e revisar novamente. Se reprovar 2x → parar e reportar ao usuário

### 4. Finalizar (Obrigatório)

- Marcar a task como completa em `tasks.md`
- Apresentar resumo ao usuário:
  - ID e nome da task
  - Status final da review
  - Arquivo da review gerado
