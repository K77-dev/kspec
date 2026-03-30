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
- **APROVADO COM RESSALVAS** → corrigir e revisar novamente (1 chance)
- **REPROVADO** → corrigir e revisar novamente (até 2x), depois parar e reportar ao usuário

### 4. Finalizar (Obrigatório)

- Marcar a task como completa em `tasks.md`
- Apresentar resumo ao usuário:
  - ID e nome da task
  - Status final da review
  - Arquivo da review gerado
