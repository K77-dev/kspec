---
name: kspec-tasks
version: 1.0.0
description: Cria lista de tarefas incrementais a partir de um PRD e Tech Spec. Mostra lista high-level para aprovação antes de gerar arquivos individuais.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-tasks**

Você é um assistente especializado em gerenciamento de projetos de desenvolvimento de software. Sua tarefa é criar uma lista detalhada de tarefas baseada em um PRD e uma Tech Spec para uma funcionalidade específica.

## Regras

- Para qualquer pergunta de escolha ao usuário, use SEMPRE a ferramenta `AskUserQuestion` (interface nativa de seleção). Não escreva opções em texto pedindo "responda com os números/letras" — isso quebra a UX e é proibido.
- Mostre a lista de tasks high-level para aprovação antes de gerar qualquer arquivo — evita retrabalho caso o sequenciamento ou agrupamento estejam errados.
- Cada tarefa deve ser um entregável funcional e incremental — tarefas que não entregam valor sozinhas dificultam code review e rollback.
- Cada tarefa deve incluir testes de unidade e integração — garantem o funcionamento e o objetivo de negócio de cada entregável.
- Não implemente código — o foco desta etapa é planejamento, não execução.
- Referencie a techspec em vez de repetir detalhes de implementação — evita divergência entre documentos.
- Siga rigorosamente os templates — tasks fora do padrão quebram a rastreabilidade PRD → Tech Spec → Tasks.

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-tasks 001-prd-auth`) e não prossiga até receber.

## Pré-requisitos

- PRD requerido: `@spec/tasks/$ARGUMENTS/prd.md`
- Tech Spec requerido: `@spec/tasks/$ARGUMENTS/techspec.md`

## Etapas do Processo

### 0. Validação de Skills Empresariais (Obrigatório)

**Pré-requisito — garantir presença do arquivo de validação:**

Verifique se `.claude/validation/enterprise-skills-check.md` existe no projeto-alvo. Se NÃO existir, baixe-o do repositório oficial do kspec antes de prosseguir. Use o primeiro método disponível, na ordem:

```bash
mkdir -p .claude/validation

gh api repos/K77-dev/kspec/contents/.claude/validation/enterprise-skills-check.md \
  -H "Accept: application/vnd.github.raw" \
  > .claude/validation/enterprise-skills-check.md 2>/dev/null \
  && test -s .claude/validation/enterprise-skills-check.md \
  || {
    TMP=$(mktemp -d)
    git clone --depth 1 --filter=blob:none --sparse \
      git@github.com:K77-dev/kspec.git "$TMP" 2>/dev/null \
      || git clone --depth 1 --filter=blob:none --sparse \
           https://github.com/K77-dev/kspec.git "$TMP"
    git -C "$TMP" sparse-checkout set .claude/validation
    cp "$TMP/.claude/validation/enterprise-skills-check.md" .claude/validation/
    rm -rf "$TMP"
  }
```

Se nenhum método baixar o arquivo (sem `gh`, sem credenciais git, sem rede), reporte:
`✗ Não foi possível obter .claude/validation/enterprise-skills-check.md do kspec. Verifique acesso ao repositório K77-dev/kspec ou execute /kspec-bootstrap manualmente.`
e BLOQUEIE a execução.

**Validação propriamente dita:**

Siga as instruções em `@.claude/validation/enterprise-skills-check.md` para validar e instalar as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação bloquear a execução.

1. **Analisar PRD e Tech Spec**

- Extrair requisitos e decisões técnicas
- Identificar componentes principais
- Se `graphify-out/graph.json` existir, consultar o grafo para mapear dependências reais entre os componentes citados na techspec — use `graphify path "ComponenteA" "ComponenteB"` para descobrir ordem de dependência. Seguir `.claude/rules/graphify.md`. O sequenciamento das tasks (passo 2) deve refletir essas dependências.

2. **Gerar Estrutura de Tarefas e Aprovar**

- Organizar sequenciamento
- Apresentar a lista high-level ao usuário e perguntar via `AskUserQuestion` com opções `Aprovar` / `Ajustar` (e o usuário pode usar o campo "Other" para indicar quais tasks remover, reordenar ou adicionar)
- NÃO prossiga para o Passo 3 até receber a aprovação do usuário

3. **Gerar Arquivos de Tarefas Individuais**

- Criar arquivo para cada tarefa principal
- Detalhar subtarefas e critérios de sucesso
- Detalhar os testes de unidade e integração

## Diretrizes de Criação de Tarefas

- Agrupar tarefas por entregável lógico
- Ordenar logicamente, com dependências antes de dependentes (ex: backend antes do frontend, backend e frontend antes dos testes E2E)
- Declarar dependências explícitas para cada task usando o formato `(depende: X.0, Y.0)` no tasks.md e na seção "Dependências" de cada task individual — tasks sem dependência entre si podem ser executadas em paralelo
- Tornar cada tarefa principal independentemente completável
- Definir escopo e entregáveis claros para cada tarefa
- Incluir testes como subtarefas dentro de cada tarefa principal

## Especificações de Saída

### Localização dos Arquivos

- Pasta da funcionalidade: `@spec/tasks/$ARGUMENTS/`
- Template para a lista de tarefas: @.claude/templates/tasks-template.md
- Lista de tarefas: `@spec/tasks/$ARGUMENTS/tasks.md`
- Template para cada tarefa individual: @.claude/templates/task-template.md
- Tarefas individuais: `@spec/tasks/$ARGUMENTS/[num]_task.md`

### Formato do Resumo de Tarefas (tasks.md)

- Seguir o template em @.claude/templates/tasks-template.md

### Formato de Tarefa Individual ([num]_task.md)

- Seguir o template em @.claude/templates/task-template.md

## Diretrizes Finais

- Assuma que o leitor principal é um desenvolvedor júnior (seja o mais claro possível)
- Evite criar mais de 15 tarefas (agrupe conforme definido anteriormente)
- Use o formato X.0 para tarefas principais, X.Y para subtarefas

Após completar a análise e gerar todos os arquivos, apresente os resultados ao usuário e aguarde confirmação.
