# Tech Spec — Clean Code e SOLID em Projetos-Alvo do kspec

## Requisitos Atendidos

- REQ-001 — Rule universal `code-standards.md`
- REQ-002 — Enforcement no `kspec-review-runner`
- REQ-003 — Enforcement no `kspec-task-runner` e `kspec-implement`
- REQ-004 — Integração no `kspec-bootstrap`
- REQ-005 — Paridade entre plataformas e distribuição via CLI

## Resumo Executivo

A solução expande o ecossistema de instruções do kspec — não o código de aplicação — para tornar Clean Code e SOLID **verificáveis e enforceáveis** por agents de IA. O núcleo é `.agents/rules/code-standards.md`, hoje um placeholder de 1 linha, que passa a ser a fonte de verdade com princípios, limites mensuráveis, classificação de severidade e exemplos ✅/❌ em TypeScript e Java.

O enforcement ocorre em três camadas: **implementação** (`kspec-task-runner` com auto-verificação na etapa 7.5), **orquestração** (`kspec-implement` como gate obrigatório) e **review** (`kspec-review-runner` com checklist derivado e seção dedicada no relatório). O `kspec-bootstrap` e os templates de guias garantem visibilidade desde a instalação; a distribuição para projetos-alvo reutiliza o pipeline existente (`ruleToMdc`, symlinks, `agent-toml`) sem alterações em `src/lib/install.ts`.

Decisões confirmadas com o usuário: God Class classificada como **aviso**; limites mensuráveis aplicam-se a **todas as linguagens**; nova etapa 7.5 no task-runner **antes** da verificação de testes; templates de guias ganham seção explícita de rules; testes via **coerência estática Vitest** (padrão `bootstrap-triplatform`).

## Arquitetura do Sistema

### Visão Geral dos Componentes

| Componente | Tipo | Responsabilidade |
|------------|------|------------------|
| `.agents/rules/code-standards.md` | Rule core (source of truth) | Define princípios, limites, severidades e exemplos |
| `.agents/agents/kspec-task-runner/AGENT.md` | Agent | Lê a rule na análise; auto-verifica na etapa 7.5 antes de concluir |
| `.agents/agents/kspec-review-runner/AGENT.md` | Agent | Checklist Clean Code/SOLID; critérios bloqueantes; seção no relatório |
| `.agents/skills/kspec-implement/SKILL.md` | Skill | Gate: task só completa após auto-verificação do task-runner |
| `.agents/skills/kspec-bootstrap/SKILL.md` | Skill | Valida presença da rule; brownfield não altera princípios universais |
| `.agents/templates/claude-md-template.md` | Template | Seção "Rules — Padrões de Código" com `code-standards` obrigatória |
| `.agents/templates/cursor-md-template.md` | Template | Reforço de `code-standards` como rule core com `alwaysApply: true` |
| `tests/clean-code-solid-coherence.spec.ts` | Teste Vitest | Valida estrutura da rule e referências nos agents/skills/templates |
| `.cursor/rules/code-standards.mdc` | Artefato derivado | Gerado por `ruleToMdc` com `alwaysApply: true` (sem mudança em CLI) |
| `.codex/agents/*.toml` | Artefato derivado | Propagação dos agents via pipeline `agent-toml` existente |

**Fluxo de dados:**

```
code-standards.md (.agents/)
    ├── kspec install/update → ruleToMdc → .cursor/rules/code-standards.mdc
    ├── symlinks → .claude/rules/, .cursor/rules/ (discovery)
    ├── kspec-task-runner (leitura + auto-verificação 7.5)
    ├── kspec-review-runner (checklist + relatório)
    ├── kspec-bootstrap → guias *.bootstrap.md (via templates)
    └── kspec-implement (gate de conclusão de task)
```

## Design de Implementação

### Interfaces Principais

Não há interfaces de código TypeScript novas. O contrato é **documental** — estrutura obrigatória de `code-standards.md`:

```markdown
# Clean Code e SOLID — Padrões Universais

## 1. Propósito e Escopo
## 2. Nomenclatura Expressiva
## 3. Funções Pequenas e Responsabilidade Única
## 4. Early Returns
## 5. DRY (Don't Repeat Yourself)
## 6. Comentários
## 7. Tratamento Explícito de Erros
## 8. Magic Numbers e Parâmetros
## 9–13. SOLID (SRP, OCP, LSP, ISP, DIP) — cada um com definição, sinais, correção
## 14. Limites Mensuráveis (tabela)
## 15. Classificação de Violações (bloqueante | aviso | sugestão)
## 16. Exemplos TypeScript (✅/❌)
## 17. Exemplos Java (✅/❌)
## 18. Relação com Rules de Stack
```

Frontmatter opcional recomendado para melhorar a descrição no `.mdc`:

```yaml
---
description: Clean Code, SOLID e limites mensuráveis — rule universal sempre aplicável
---
```

### Modelos de Dados

#### Tabela de Limites Mensuráveis (§14)

| Métrica | Limite | Severidade padrão | Como verificar (agent) |
|---------|--------|-------------------|------------------------|
| Linhas úteis por função | ≤ 50 | Bloqueante se > 50 | Contar linhas excluindo comentários e brancos |
| Complexidade ciclomática estimada | ≤ 10 | Bloqueante se > 10 | Pontos de decisão (`if`, `else`, `for`, `while`, `case`, `catch`, `&&`, `\|\|`, `?`) + 1 |
| Parâmetros por função/método | ≤ 4 | Aviso se > 4 | Contar parâmetros formais |
| Profundidade de aninhamento | ≤ 3 | Aviso se > 3 | Contar níveis de `{}` aninhados |
| God Class | > 300 linhas OU > 15 métodos públicos | **Aviso** (decisão do usuário) | Contar no arquivo/classe em escopo da task |
| Duplicação | > 6 linhas idênticas em 2+ locais | Bloqueante | Comparar blocos no diff e arquivos tocados |

#### Classificação de Violações (§15)

| Nível | Efeito no review | Exemplos |
|-------|------------------|----------|
| **Bloqueante** | REPROVADO | Função > 50 linhas; complexidade > 10; SRP violado em código novo; DIP com dependência concreta injetável; duplicação > 6 linhas |
| **Aviso** | APROVADO COM RESSALVAS | God Class; parâmetros > 4; aninhamento > 3; violações menores de OCP/ISP |
| **Sugestão** | Não afeta status | Melhorias de nomenclatura; comentários removíveis; refatorações opcionais |

Os limites aplicam-se a **todas as linguagens** no escopo do diff; exemplos ilustrativos permanecem apenas em TypeScript e Java.

### Endpoints de API

N/A — funcionalidade exclusivamente de artefatos de especificação e instrução para agents.

## Pontos de Integração

| Integração | Modo | Tratamento de falha |
|----------|------|---------------------|
| `ruleToMdc` em `src/lib/install.ts` | Já trata `code-standards` com `alwaysApply: true` | Nenhuma alteração de código; testes existentes em `rule-to-mdc.spec.ts` permanecem válidos |
| Symlinks `.claude/`, `.cursor/` | `kspec install` / `kspec update` | Paridade garantida editando apenas `.agents/` |
| Codex TOML | `src/lib/agent-toml.ts` | Agents atualizados propagam automaticamente no update |
| Enterprise rules | Excluídas do escopo | `code-standards.md` é core kspec, não enterprise |

## Verificações Técnicas

### Segurança

N/A para alteração de conteúdo instrucional. A rule existente no review-runner (Step 4) permanece inalterada. Nenhum secret ou dado sensível nos exemplos de código.

### Arquitetura

- **Source of truth**: `.agents/` — toda edição começa aqui.
- **Sem novo agent/skill**: enforcement nos artefatos existentes (decisão do PRD).
- **Verificação manual pelos agents**: sem ESLint/SonarQube neste escopo.
- **Brownfield**: passo 5.6 do bootstrap já exclui `code-standards.md` da adaptação; RF-004.3 reforça que SOLID/Clean Code são inegociáveis — apenas convenções de estilo em rules enterprise são adaptáveis.

### Infraestrutura

Distribuição via publicação do pacote `@k77-dev/kspec`. Projetos-alvo executam `kspec update` para receber rule e agents atualizados. Rollback: reverter versão do pacote npm.

## Abordagem de Testes

### Testes Unidade

Novo arquivo `tests/clean-code-solid-coherence.spec.ts` com asserções estáticas (sem mock de FS além de `readFileSync`):

**Rule `code-standards.md`:**
- Contém ≥ 15 seções numeradas
- Contém tabela de limites com valores 50, 10, 4, 3, 300, 15, 6
- Contém classificação bloqueante/aviso/sugestão
- Contém exemplos ✅ e ❌ para TypeScript e Java
- Contém seções SRP, DIP, nomenclatura e funções longas
- `wc -w` estimado ≤ 2.000 palavras (ou contagem de palavras no teste com margem)

**`kspec-review-runner/AGENT.md`:**
- Referencia `code-standards.md` como rule obrigatória
- Step 8 expandido com checklist dos 5 princípios SOLID
- Critérios bloqueantes explícitos e separados de avisos
- Formato de relatório inclui seção "Conformidade Clean Code/SOLID" com tabela item × status
- Citação de seções da rule (ex.: `code-standards.md § SRP`)

**`kspec-task-runner/AGENT.md`:**
- Etapa "Verificação Clean Code/SOLID" (7.5) entre testes e verificação final
- Referencia limites 50 linhas, complexidade 10, 4 parâmetros
- Instrução de corrigir violações antes de entregar

**`kspec-implement/SKILL.md`:**
- Menciona auto-verificação como gate obrigatório de conclusão

**`kspec-bootstrap/SKILL.md`:**
- Confirma `code-standards.md` em 5.4 como core obrigatório
- Relatório final (passo 8) inclui validação da rule
- Brownfield: princípios universais não adaptáveis

**Templates:**
- `claude-md-template.md` contém seção "Rules — Padrões de Código" com `code-standards.md` e descrição "Clean Code, SOLID, limites mensuráveis"
- `cursor-md-template.md` lista `code-standards` com `alwaysApply: true`

### Testes de Integração

Executar `npm test` após implementação — suite completa deve permanecer verde. Opcionalmente rodar `kspec update` em fixture de `tests/install.spec.ts` e verificar que `code-standards.mdc` contém corpo expandido e `alwaysApply: true`.

### Testes de E2E

N/A — validação manual recomendada: invocar `kspec-implement` em projeto de teste e verificar que review reprova função > 50 linhas com citação `§ Limites Mensuráveis`.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **`code-standards.md`** — fundação; todos os demais artefatos referenciam este conteúdo.
2. **`kspec-review-runner/AGENT.md`** — checklist e formato de relatório; define critérios que task-runner deve antecipar.
3. **`kspec-task-runner/AGENT.md`** — etapa 7.5 alinhada aos mesmos critérios do review.
4. **`kspec-implement/SKILL.md`** — gate de orquestração.
5. **Templates + `kspec-bootstrap/SKILL.md`** — visibilidade em projetos novos.
6. **`tests/clean-code-solid-coherence.spec.ts`** — trava regressões de conteúdo.
7. **`npm run build` + `npm test`** — validar pipeline de distribuição inalterado.

### Dependências Técnicas

- Nenhuma infraestrutura externa.
- Publicação npm para entrega em projetos-alvo (fora do escopo de implementação local).

## Monitoramento e Observabilidade

### Error Tracking

N/A — artefatos estáticos Markdown.

### Logging Estruturado

N/A.

### Health Checks

N/A.

### Métricas de Negócio

Métricas de sucesso do PRD (qualitativas, pós-release):
- Reviews passam a citar seções `code-standards.md § *`
- Redução de retrabalho manual por violações básicas (feedback qualitativo dos devs)

### Alertas

N/A.

## Considerações Técnicas

### Decisões Principais

| Decisão | Justificativa | Alternativa rejeitada |
|---------|---------------|----------------------|
| God Class = aviso | Evita reprovação excessiva em legado brownfield | Bloqueante — muito rígido para codebases existentes |
| Limites universais (todas linguagens) | Consistência entre projetos Java, TS, Python, etc. | Só TS/Java — deixaria outras stacks sem enforcement |
| Etapa 7.5 antes da verificação de testes | Qualidade estrutural verificada antes do gate final | Após testes — atrasaria correções estruturais |
| Seção de rules nos templates | Visibilidade desde bootstrap (escolha do usuário) | Só no SKILL — guias gerados poderiam omitir a rule |
| Testes de coerência estática | Padrão já usado em `bootstrap-triplatform.spec.ts`; sem flakiness | Snapshot de hash — frágil a reformulações legítimas |
| Sem alteração em `install.ts` | `ruleToMdc` já implementa `alwaysApply: true` para `code-standards` | Duplicar lógica — desnecessário |

### Riscos Conhecidos

| Risco | Mitigação |
|-------|-----------|
| Rule > 2.000 palavras consome contexto dos agents | Contagem no teste; exemplos concisos; tabela em vez de prosa |
| Agents ignoram checklist extenso | Checklist em tabela compacta; critérios bloqueantes em `<critical>` |
| Estimativa manual imprecisa (complexidade, linhas) | Instruir margem conservadora; review como segunda linha de defesa |
| `.agents/rules/code-standards.md` e `.claude/rules/` divergem | Editar só `.agents/`; `kspec update` regenera `.mdc` |

### Conformidade com Skills Padrões

| Skill/Rule | Aplicabilidade |
|------------|----------------|
| `code-standards.md` (meta) | A própria rule sendo criada seguirá os limites que define |
| `graphify.md` | N/A — sem código executável novo em `src/` |
| Enterprise rules (`react.md`, `spring-boot.md`, etc.) | Fora de escopo; `code-standards` permanece independente |

### Arquivos relevantes e dependentes

**Modificar (source of truth):**
- `.agents/rules/code-standards.md`
- `.agents/agents/kspec-review-runner/AGENT.md`
- `.agents/agents/kspec-task-runner/AGENT.md`
- `.agents/skills/kspec-implement/SKILL.md`
- `.agents/skills/kspec-bootstrap/SKILL.md`
- `.agents/templates/claude-md-template.md`
- `.agents/templates/cursor-md-template.md`
- `tests/clean-code-solid-coherence.spec.ts` (novo)

**Derivados (propagação automática — não editar diretamente):**
- `.cursor/rules/code-standards.mdc` — via `ruleToMdc`
- `.claude/rules/code-standards.md` — symlink → `.agents/rules/`
- `.cursor/rules/code-standards.mdc` — gerado no install/update
- `.codex/agents/kspec-review-runner.toml`, `kspec-task-runner.toml` — via `agent-toml`

**Referência (sem alteração esperada):**
- `src/lib/install.ts` — `buildMdcFrontmatter` linha 152: `alwaysApply: name === "code-standards"`
- `tests/rule-to-mdc.spec.ts` — testes de conversão MDC
- `tests/install.spec.ts` — fixture de distribuição
- `tests/skills-coherence.spec.ts` — pode estender com asserções de `kspec-implement` + Clean Code gate
- `CLAUDE.md`, `AGENTS.md`, `CURSOR.md` — documentação raiz do kspec (atualização opcional pós-implementação, fora do escopo mínimo do PRD)
