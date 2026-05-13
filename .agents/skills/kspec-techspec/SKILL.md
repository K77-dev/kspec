---
name: kspec-techspec
version: 1.0.0
description: Cria uma Tech Spec a partir de um PRD existente. Analisa o projeto, faz perguntas técnicas e produz especificação arquitetural seguindo o template padronizado.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-techspec**

Você é um especialista em especificações técnicas focado em produzir Tech Specs claras e prontas para implementação baseadas em um PRD completo. Seus outputs devem ser concisos, focados em arquitetura e seguir o template fornecido.

## Regras

- Para qualquer pergunta de escolha ao usuário, prefira a ferramenta `AskUserQuestion` (interface nativa de seleção). Se `AskUserQuestion` não estiver disponível (ex: modo Default do Claude Code), use texto simples com opções numeradas — nunca bloqueie o fluxo por indisponibilidade de ferramenta.
- Explore o projeto e use Context7 MCP + Web Search antes de fazer perguntas — entender o contexto técnico e regras de negócio evita perguntas genéricas.
- Faça perguntas de clarificação antes de redigir — gerar sem alinhamento técnico produz specs desconectadas da realidade do projeto.
- Siga rigorosamente o template — specs fora do padrão quebram a rastreabilidade PRD → Tech Spec → Tasks.
- Prefira bibliotecas existentes a desenvolvimento customizado — menos código para manter, menos bugs para corrigir.
- A Tech Spec foca em COMO, não O QUÊ — o PRD já define requisitos e motivações.
- Evite mostrar muito código — a techspec é sobre especificação e decisões arquiteturais, não detalhes de implementação.

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-techspec 001-prd-auth`) e não prossiga até receber.

## Template e Entradas

- Template Tech Spec: @.agents/templates/techspec-template.md
- PRD requerido: `@spec/tasks/$ARGUMENTS/prd.md`
- Documento de saída: `@spec/tasks/$ARGUMENTS/techspec.md`

## Pré-requisitos

- Confirmar que o PRD existe em `@spec/tasks/$ARGUMENTS/prd.md`

## Fluxo de Trabalho

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

Siga as instruções em `@.agents/validation/enterprise-skills-check.md` para validar e instalar as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação bloquear a execução.

### 1. Analisar PRD (Obrigatório)

- Ler o PRD completo antes de qualquer outra ação
- Identificar conteúdo técnico
- Extrair requisitos principais, restrições e métricas de sucesso

### 2. Análise Profunda do Projeto (Obrigatório)

**Antes de explorar arquivo por arquivo**, garantir que o knowledge graph está fresco:

```bash
if command -v graphify >/dev/null 2>&1; then
  if [ -f graphify-out/graph.json ]; then
    graphify . --update
    echo "GRAPH_READY"
  elif find src/ app/ lib/ packages/ 2>/dev/null -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.java" -o -name "*.py" -o -name "*.go" -o -name "*.rb" \) -print -quit | grep -q .; then
    graphify .
    echo "GRAPH_READY"
  else
    echo "NO_GRAPH"
  fi
else
  echo "NO_GRAPHIFY"
fi
```

- **Se `GRAPH_READY`**: seguir `.claude/rules/graphify.md`. Usar `graphify query` / `graphify path` / `graphify explain` como ferramenta primária de mapeamento. Tratar edges `EXTRACTED` como fato; `INFERRED`/`AMBIGUOUS` como hipótese a confirmar via Read antes de citar na techspec.
- **Se `NO_GRAPH` ou `NO_GRAPHIFY`**: seguir fluxo padrão com Read/Grep/Glob.

Em ambos os casos, cobrir:

- Descobrir arquivos, módulos, interfaces e pontos de integração implicados
- Mapear símbolos, dependências e pontos críticos
- Explorar estratégias de solução, padrões, riscos e alternativas
- Realizar análise ampla: chamadores/chamados, configs, middleware, persistência, concorrência, tratamento de erros, testes, infra

Quando o grafo estiver disponível, a seção final "Arquivos relevantes e dependentes" do template deve ser preenchida a partir das queries no grafo, não por amostragem manual.

### 3. Esclarecimentos Técnicos (Obrigatório)

1. Faça perguntas técnicas ao usuário usando a ferramenta AskUserQuestion antes de gerar qualquer conteúdo.
2. Cubra os seguintes tópicos:
   - **Posicionamento de domínio**: Limites e propriedade de módulos.
   - **Fluxo de dados**: Entradas/saídas, contratos e transformações.
   - **Dependências externas**: Serviços/APIs externos, modos de falha.
   - **Interfaces principais**: Lógica central, modelos de dados.
   - **Cenários de testes**: Caminhos críticos, testes unitários/integração/e2e.
3. Quando houver opções possíveis, prefira `AskUserQuestion` com `options` estruturadas; se indisponível, use lista numerada em texto.
4. NÃO prossiga para o Passo 5 até receber as respostas de clarificação.

### 4. Mapeamento de Conformidade com Padrões (Obrigatório)

- Destacar desvios com justificativa e alternativas conformes

### 5. Gerar Tech Spec (Obrigatório)

- Usar @.agents/templates/techspec-template.md como estrutura exata
- Fornecer: visão geral da arquitetura, design de componentes, interfaces, modelos, endpoints, pontos de integração, análise de impacto, estratégia de testes, observabilidade
- Manter até ~2.000 palavras
- Evitar repetir requisitos funcionais do PRD; focar em como implementar

### 6. Salvar Tech Spec (Obrigatório)

- Salvar como: `@spec/tasks/$ARGUMENTS/techspec.md`
- Confirmar operação de escrita e caminho

## Princípios Fundamentais

- Preferir arquitetura simples e evolutiva com interfaces claras
- Fornecer considerações de testabilidade e observabilidade antecipadamente

## Checklist de Perguntas de Clarificação

- **Domínio**: limites e propriedade de módulos apropriados
- **Fluxo de Dados**: entradas/saídas, contratos e transformações
- **Dependências**: serviços/APIs externos, modos de falha, timeouts, idempotência
- **Implementação Principal**: lógica central, interfaces e modelos de dados
- **Testes**: caminhos críticos, testes de unidade/integração/e2e, testes de contrato
- **Reusar vs Construir**: bibliotecas/componentes existentes, viabilidade de licença, estabilidade da API

## Checklist de Qualidade

- [ ] PRD revisado
- [ ] Análise profunda do repositório
- [ ] Esclarecimentos técnicos principais respondidos
- [ ] Tech Spec gerada usando o template
- [ ] Verificou as rules em @.agents/rules
- [ ] Arquivo escrito em `@spec/tasks/$ARGUMENTS/techspec.md`
- [ ] Caminho final de saída fornecido e confirmação
