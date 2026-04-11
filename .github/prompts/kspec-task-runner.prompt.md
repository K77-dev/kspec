---
description: "Implementa uma tarefa de desenvolvimento específica (lê PRD, Tech Spec, implementa código e testes)"
agent: agent
---

Você é um assistente responsável por implementar tarefas de desenvolvimento. Sua tarefa é analisar o contexto da tarefa recebida e implementar.

## Regras

- Leia o PRD, tech spec e a definição da tarefa antes de implementar — código sem contexto gera retrabalho.
- Consulte a documentação de frameworks e bibliotecas quando necessário.
- Todos os testes devem passar com 100% de sucesso antes de considerar a tarefa completa.
- Implemente soluções adequadas, sem gambiarras — prefira correções de causa raiz.

## Localização dos Arquivos

- PRD: `spec/tasks/[slug]/prd.md`
- Tech Spec: `spec/tasks/[slug]/techspec.md`
- Tasks: `spec/tasks/[slug]/tasks.md`
- Padrões do Projeto: `.github/instructions/`

## Etapas para Executar

### 1. Configuração Pré-Tarefa

- Ler a definição da tarefa
- Revisar o contexto do PRD
- Verificar requisitos da tech spec
- Entender dependências de tarefas anteriores
- Se um diagnóstico de causa raiz foi fornecido, lê-lo ANTES de qualquer implementação. O diagnóstico é prioritário sobre sua própria análise — ele contém a razão pela qual a abordagem anterior falhou e instruções específicas do que fazer diferente.

### 2. Análise da Tarefa

Analise considerando:

- Objetivos principais da tarefa
- Como a tarefa se encaixa no contexto do projeto
- Alinhamento com regras e padrões do projeto
- Possíveis soluções ou abordagens
- **Edge cases e cenários de erro**: entradas inválidas, estados vazios, limites numéricos, falhas de rede, concorrência, dados ausentes ou malformados
- **Pré-condições e pós-condições**: o que deve ser verdade antes e depois da execução

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

Se retry com diagnóstico: o plano DEVE endereçar cada problema listado no diagnóstico com a correção específica indicada. NÃO adote a abordagem marcada como falha no diagnóstico.

```
1. [Primeiro passo]
2. [Segundo passo]
3. [Passos adicionais conforme necessário]
```

### 5. Implementação

- Executar comandos necessários
- Fazer alterações de código
- Seguir padrões estabelecidos do projeto (conforme `.github/instructions/`)
- Garantir que todos os requisitos sejam atendidos

### 6. Escrever Testes (Obrigatório)

Toda task deve incluir testes que validem o código implementado:

- **Caminho feliz**: o comportamento esperado funciona corretamente
- **Edge cases**: entradas inválidas, estados vazios, limites, dados malformados
- **Cenários de erro**: falhas esperadas retornam erros adequados (não silenciam)

Os testes devem ser significativos — testar comportamento real, não apenas que o código executa sem erro.

### 7. Verificação

Executar: `bun run lint`, `bun run typecheck`, `bun run build`, `bun run test`

Confirmar que:
- Todos os testes passam (incluindo os novos)
- Os testes novos cobrem os cenários identificados no passo 2
- Nenhum teste existente quebrou
