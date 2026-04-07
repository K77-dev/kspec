---
name: kspec-adr
description: Gera Architecture Decision Records (ADRs) para documentar decisões técnicas importantes. Salva em spec/adrs/.
---

Documenta decisões arquiteturais importantes do projeto em formato ADR (Architecture Decision Record).

## Fluxo de Trabalho

### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.agents/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.

### 1. Coletar Contexto (Obrigatório)

Perguntar ao usuário:

1. **Qual decisão precisa ser documentada?** (ex: "Escolha do Prisma como ORM", "Migração de REST para GraphQL")
2. **Qual o contexto/problema?** (o que motivou a decisão)
3. **Quais opções foram consideradas?** (pelo menos 2)
4. **Qual foi a decisão final e por quê?**
5. **Há riscos ou trade-offs conhecidos?**

### 2. Determinar Número do ADR (Obrigatório)

- Verificar se `spec/adrs/` existe, criar se não
- Listar ADRs existentes para determinar o próximo número sequencial
- Formato: `NNN` com 3 dígitos (001, 002, 003...)

### 3. Gerar ADR (Obrigatório)

- Usar o template @.agents/templates/adr-template.md
- Preencher todas as seções com base nas respostas do usuário
- Status inicial: **Aceita**
- Salvar em: `spec/adrs/NNN-titulo-em-kebab-case.md`

### 4. Atualizar Índice (Obrigatório)

Criar ou atualizar `spec/adrs/index.md` com a lista de todos os ADRs:

```markdown
# Architecture Decision Records

| # | Título | Status | Data |
|---|--------|--------|------|
| 001 | [Título](001-titulo.md) | Aceita | YYYY-MM-DD |
| 002 | [Título](002-titulo.md) | Aceita | YYYY-MM-DD |
```

### 5. Reportar Resultados

- Caminho do ADR gerado
- Número do ADR
- Lembrar que ADRs relacionados a TechSpecs específicas podem ser referenciados na seção "Decisões Principais"
