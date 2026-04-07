---
name: kspec-migrate
description: Planeja e executa upgrades de frameworks e dependências. Analisa breaking changes, gera plano de migração como tasks e executa incrementalmente.
---

Planeja e guia upgrades de frameworks, bibliotecas e dependências do projeto de forma estruturada e incremental.

## Argumento

`<dependência@versão>` — dependência a migrar e versão alvo (ex: `react@19`, `tailwindcss@4`, `hono@4`)

O argumento recebido é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar a dependência e versão alvo (ex: `/kspec-migrate react@19`) e não prossiga até receber.

## Fluxo de Trabalho

### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.

### 1. Análise da Dependência Atual (Obrigatório)

- Ler `package.json` (raiz e workspaces) para identificar a versão atual da dependência
- Identificar todas as dependências relacionadas que podem ser afetadas (ex: `@types/react` ao migrar React)
- Listar arquivos que importam ou usam a dependência: `grep -r "from '[dependência]" --include="*.ts" --include="*.tsx"`

### 2. Consultar Guia de Migração (Obrigatório)

- Usar Context7 MCP (se disponível) para buscar o migration guide oficial da dependência
- Identificar:
  - Breaking changes entre a versão atual e a versão alvo
  - APIs removidas ou renomeadas
  - Novos padrões recomendados
  - Codemods disponíveis (se houver)

Se Context7 não estiver disponível, consultar a documentação oficial online.

### 3. Análise de Impacto (Obrigatório)

Cruzar breaking changes com o código do projeto:

- [ ] Quais arquivos usam APIs que mudaram
- [ ] Quais testes precisam ser atualizados
- [ ] Quais dependências relacionadas precisam de upgrade conjunto
- [ ] Há codemods que podem automatizar parte da migração

Apresentar relatório de impacto ao usuário:

```
## Análise de Impacto — [dependência] [versão-atual] → [versão-alvo]

- Arquivos afetados: [X]
- Breaking changes aplicáveis: [Y]
- Dependências relacionadas para atualizar: [lista]
- Codemods disponíveis: [sim/não]
- Risco estimado: [Baixo | Médio | Alto]
```

### 4. Gerar Plano de Migração (Obrigatório)

Criar um plano de migração como lista de tasks incrementais:

1. **Atualizar dependências** — bump versions no package.json
2. **Aplicar codemods** — se disponíveis, rodar automaticamente
3. **Corrigir breaking changes** — arquivo por arquivo, começando pelos mais simples
4. **Atualizar testes** — adaptar testes afetados
5. **Validar** — rodar lint, typecheck, build, test

Apresentar o plano ao usuário para aprovação antes de executar.

### 5. Executar Migração (Obrigatório)

Após aprovação do usuário, executar o plano incrementalmente:

- Cada passo deve ser validado antes de prosseguir (`bun run typecheck`, `bun run test`)
- Se um passo falhar, parar e reportar o problema
- NÃO fazer múltiplas mudanças sem validação intermediária

### 6. Verificação Final (Obrigatório)

Executar todos os checks:
```bash
bun run lint
bun run typecheck
bun run build
bun run test
```

Confirmar que:
- [ ] Todos os testes passam
- [ ] Build completa sem erros
- [ ] Nenhum warning novo introduzido
- [ ] Versão da dependência atualizada no package.json e lockfile

### 7. Reportar Resultados

- Versão anterior → versão nova
- Arquivos modificados
- Breaking changes resolvidos
- Testes atualizados
- Alertas ou problemas remanescentes

## Checklist de Qualidade

- [ ] Versão atual identificada
- [ ] Guia de migração consultado
- [ ] Impacto analisado e apresentado
- [ ] Plano aprovado pelo usuário
- [ ] Migração executada incrementalmente
- [ ] Todos os checks passam
- [ ] Relatório final apresentado
