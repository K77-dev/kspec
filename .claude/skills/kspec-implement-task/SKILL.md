---
name: kspec-implement-task
description: Implementa a próxima tarefa de desenvolvimento disponível. Lê PRD, Tech Spec e a definição da tarefa, implementa o código, executa checks e aciona o agent de review.
---

Você é um assistente IA responsável por implementar tarefas de desenvolvimento. Sua tarefa é identificar a próxima tarefa disponível, analisar o contexto e implementar.

## Regras

- Leia o PRD, tech spec e a definição da tarefa antes de implementar — código sem contexto gera retrabalho.
- Carregue as skills necessárias com base nas tecnologias da tarefa — skills garantem aderência aos padrões de cada domínio.
- Use o Context7 MCP para consultar documentação de frameworks e bibliotecas — evita implementações baseadas em APIs desatualizadas.
- Todos os testes devem passar com 100% de sucesso antes de considerar a tarefa completa — código sem testes passando não é entregável.
- Após a verificação, use o agent `kspec-review` para validar o código — se houver problemas, resolva e analise novamente.
- Marque a tarefa como completa em tasks.md após a review passar.
- Implemente soluções adequadas, sem gambiarras — prefira correções de causa raiz.

## Localização dos Arquivos

- PRD: `@spec/tasks/prd-[nome-funcionalidade]/prd.md`
- Tech Spec: `@spec/tasks/prd-[nome-funcionalidade]/techspec.md`
- Tasks: `@spec/tasks/prd-[nome-funcionalidade]/tasks.md`
- Regras do Projeto: @.claude/rules

## Etapas para Executar

### 1. Configuração Pré-Tarefa

- Ler a definição da tarefa
- Revisar o contexto do PRD
- Verificar requisitos da tech spec
- Entender dependências de tarefas anteriores

### 2. Análise da Tarefa

Analise considerando:

- Objetivos principais da tarefa
- Como a tarefa se encaixa no contexto do projeto
- Alinhamento com regras e padrões do projeto
- Possíveis soluções ou abordagens

### 3. Resumo da Tarefa

```
ID da Tarefa: [ID ou número]
Nome da Tarefa: [Nome ou descrição breve]
Contexto PRD: [Pontos principais do PRD]
Requisitos Tech Spec: [Requisitos técnicos principais]
Dependências: [Lista de dependências]
Objetivos Principais: [Objetivos primários]
Riscos/Desafios: [Riscos ou desafios identificados]
```

### 4. Plano de Abordagem

```
1. [Primeiro passo]
2. [Segundo passo]
3. [Passos adicionais conforme necessário]
```

### 5. Implementação

Após o resumo e plano, comece a implementar:

- Carregar as skills necessárias com base nas tecnologias envolvidas
- Executar comandos necessários
- Fazer alterações de código
- Seguir padrões estabelecidos do projeto
- Garantir que todos os requisitos sejam atendidos

### 6. Verificação

Executar os checks obrigatórios conforme definido em "Comandos do projeto" no CLAUDE.md antes de prosseguir para a review.

### 7. Revisão

- Use o agent `kspec-review` para validar o código
- Ajuste os problemas indicados
- Não finalize a tarefa até a review passar
- Marque como completa em tasks.md
