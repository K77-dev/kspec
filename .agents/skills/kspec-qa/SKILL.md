---
name: kspec-qa
version: 1.0.0
description: Executa Quality Assurance da funcionalidade completa. Testa fluxos E2E com TestSprite MCP, verifica acessibilidade (WCAG 2.2), documenta bugs em bugs.md e gera relatório qa.md. Execute após todas as tasks estarem implementadas e revisadas.
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-qa**

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-qa 001-prd-auth`) e não prossiga até receber.

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

Delegue a execução ao agent `kspec-qa-runner` para rodar em contexto isolado — o QA produz output verboso que não deve consumir o contexto principal.

Passe ao agent:
- O caminho da funcionalidade: `@spec/tasks/$ARGUMENTS/`
- O PRD, TechSpec e Tasks da funcionalidade

Após o agent concluir, apresente ao usuário:
- Status: APROVADO ou REPROVADO
- Quantidade de bugs encontrados (se houver)
- Caminho do relatório `qa.md`
- Se reprovado, sugira executar `/kspec-bugfix` para corrigir os bugs
