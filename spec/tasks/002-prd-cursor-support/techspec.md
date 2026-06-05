# Tech Spec — Suporte ao Cursor no kspec (v1.3.0)

> PRD de origem: `spec/tasks/002-prd-cursor-support/prd.md`

## Resumo Executivo

Adicionamos o **Cursor** como terceira camada de discovery do kspec, em paridade com Claude Code (`.claude/`) e Codex CLI (`.codex/`), mantendo `.agents/` como único source of truth. A estratégia reaproveita a mecânica já existente em `src/lib/install.ts` (`linkOrCopy` idempotente + geração hash-based): para o Cursor criamos symlinks de `skills`, `agents`, `templates` e `validation` apontando para `.agents/`, e geramos artefatos **derivados** `.cursor/rules/*.mdc` (formato Cursor) a partir de `.agents/rules/*.md` (formato Claude). Um `CURSOR.md` na raiz, gerado a partir de novo template, completa a paridade documental.

A decisão central é não introduzir um novo subsistema: a lógica de Cursor é adicionada **inline em `install.ts`** (mesmo padrão das funções `buildClaudeLinks`/`buildCodexAgentsToml`), reutilizando `hashContent`/`readExistingHash` para idempotência e `linkOrCopy` para o fallback de cópia no Windows. A única peça realmente nova é o conversor `.md → .mdc`, baseado em heurística simples de frontmatter. Versão sobe de 1.2.0 para **1.3.0** (minor, retrocompatível).

## Arquitetura do Sistema

### Visão Geral dos Componentes

Componentes **modificados**:

- **`src/lib/install.ts`** — orquestra `runInstall`. Recebe novas funções inline:
  - `buildCursorSkillsLinks(targetRoot, skills)` — symlinks `.cursor/skills/<nome>` → `../../.agents/skills/<nome>` (todas as skills, incl. empresariais).
  - `buildCursorAgentsLinks(targetRoot, agents)` — symlinks `.cursor/agents/<nome>` → `../../.agents/agents/<nome>` (decisão do usuário; ver Riscos).
  - `buildCursorDirLinks(targetRoot)` — symlinks de diretório `.cursor/templates` e `.cursor/validation` → `.agents/...` (idêntico a `CLAUDE_DIR_LINKS`, **exceto `rules`**, que é derivado).
  - `buildCursorRulesMdc(targetRoot)` — converte cada `.agents/rules/*.md` em `.cursor/rules/*.mdc` (hash-based skip).
  - `ensureRootDocs(...)` — estendida para também materializar `CURSOR.md`.
  - `InstallReport` — estendido com `linkedCursorSkills`, `linkedCursorAgents`, `generatedMdc`.
- **`src/utils/paths.ts`** — novos resolvedores `getCursorMdSource()` (e, se necessário, `getCursorSourceDir()`).
- **`src/utils/output.ts`** — `printInstallSummary` passa a reportar artefatos Cursor.
- **`src/lib/migration.ts`** — `detectMigration` passa a inspecionar também `.cursor/` para os subdirs esperados como symlink (`skills`, `agents`, `templates`, `validation`) — **`.cursor/rules` é excluído** por ser diretório real/derivado legítimo.
- **`src/commands/init.ts`** — `printNextSteps` menciona Cursor.

Componentes **novos** (artefatos, não código):

- **`CURSOR.md`** (raiz) e **`.agents/templates/cursor-md-template.md`**.
- Atualizações de conteúdo em `AGENTS.md`, `CLAUDE.md`, `README.md`, skills `kspec-bootstrap` e `kspec-version`.

**Fluxo de dados:** `runInstall` → copia `.agents/` → lista `skills`/`agents` → constrói camadas Claude, Codex e **Cursor** em sequência → garante docs raiz. O conversor lê `.agents/rules/<x>.md` (seguindo symlinks via `readFileSync`), parseia frontmatter, aplica heurística, renderiza `.mdc`, compara hash e só escreve se mudou.

## Design de Implementação

### Interfaces Principais

Conversor `.md → .mdc` (inline em `install.ts`, ≤20 linhas de contrato):

```typescript
interface RuleFrontmatter {
  description?: string;
  paths?: string[];        // formato Claude (entrada)
}

interface McdcFrontmatter {
  description: string;
  globs?: string;          // CSV de globs (Auto Attached)
  alwaysApply: boolean;    // Always vs Agent Requested
}

// Heurística aprovada (REQ-001):
//  - tem `paths`  → globs = paths.join(","), alwaysApply=false
//  - sem `paths`  → alwaysApply=false (Agent Requested via description)
//  - nome === "code-standards" → alwaysApply=true (exceção única)
function ruleToMdc(name: string, raw: string): string;
```

Extração de `description` (decisão `h1_body`): se o frontmatter `.md` não traz `description`, usar o primeiro heading `# H1` do corpo; na ausência, a primeira linha não vazia; fallback final = nome legível do arquivo.

### Modelos de Dados

- **Rule `.md` (entrada):** frontmatter opcional `--- ... ---` com `paths:` (lista) e/ou `description:`; corpo Markdown.
- **Rule `.mdc` (saída):** frontmatter `--- description / globs? / alwaysApply ---` + corpo Markdown **preservado byte a byte** (apenas o frontmatter é reescrito).
- **`InstallReport` (estendido):**

```typescript
interface InstallReport {
  linkedSkills: string[];
  linkedAgents: string[];
  generatedTomls: string[];
  linkedCursorSkills: string[];
  linkedCursorAgents: string[];
  generatedMdc: string[];
  errors: string[];
}
```

### Endpoints de API

Não aplicável — projeto é uma CLI/kit, sem serviços HTTP.

## Pontos de Integração

Integrações são com convenções de discovery de ferramentas locais (não serviços de rede):

- **Cursor IDE** — lê skills de `.agents/skills/` e `.cursor/skills/` (e `.claude/`/`.codex/` por compat); subagents de `.cursor/agents/` (+ compat); rules de `.cursor/rules/*.mdc`; MCP de `.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global).
- **MCP opt-in (bootstrap)** — Cursor grava `.cursor/mcp.json` (schema `mcpServers` → `command`/`args`/`env`); default **Não**, escrita só com confirmação.
- **Tratamento de erros:** symlinks de rules empresariais quebrados (apontando fora do repo no projeto consumidor) → conversão **converte os que resolvem e pula os quebrados com aviso pt-BR** (`✗ rule X ignorada: alvo não resolvido`), sem falhar o comando (decisão `skip_warn`).

## Verificações Técnicas

### Segurança

- Sem autenticação/dados sensíveis. Risco principal: escrita de arquivos no projeto-alvo. Manter o padrão atual de **nunca sobrescrever** docs finais existentes (`pathExists` guard em `ensureRootDocs`) e nunca tocar `settings.json`/`settings.local.json` (já garantido por `PRESERVED_FILES`).
- MCP nunca é registrado sem opt-in explícito (RF4.3).
- Conversão `.mdc` não executa conteúdo; apenas lê/escreve texto.

### Arquitetura

- **Padrão reutilizado:** mesma mecânica de `buildClaudeLinks`/`buildCodexAgentsToml` (idempotência por hash + `linkOrCopy`), evitando novo subsistema (decisão `in_install`).
- **Limite de responsabilidade:** `.agents/` é o único editável; `.cursor/` é 100% derivado/symlink. `.cursor/rules/*.mdc` são artefatos — documentar "edite `.agents/rules/`, rode `update`".
- **Idempotência (RF1.4):** `.mdc` via hash; symlinks via `isIdempotentSymlink`. `update` 2× = diff zero.
- **Orfãos:** `.mdc` de rule removida em `.agents/rules/` deve ser podado em `buildCursorRulesMdc` (varrer `.cursor/rules/` e remover `.mdc` sem `.md` de origem) — evita drift.

### Infraestrutura

- **Distribuição:** `package.json#files` += `.cursor/`, `CURSOR.md`; `VERSION` e `version` → `1.3.0`; `description`/`keywords` incluem `cursor`.
- **Windows (RF1.5):** `linkOrCopy` já cai para cópia + aviso; `.mdc` é arquivo gerado (independe de symlink).
- **Rollback:** mudança é aditiva; reverter = remover geração Cursor e bump. Sem migração de dados.

## Abordagem de Testes

### Testes Unidade (Vitest)

- `ruleToMdc`: (a) rule com `paths` → `globs` CSV correto, `alwaysApply:false`; (b) `code-standards` → `alwaysApply:true`; (c) rule sem `paths`/sem `description` → description extraída do H1; (d) corpo preservado; (e) idempotência (mesma entrada → mesmo hash).
- `detectMigration`: `.cursor/skills` como dir real dispara plano; `.cursor/rules` real **não** dispara.
- Conversor com symlink quebrado → retorna aviso, não lança.
- Mock apenas de FS quando necessário; preferir `tmpdir` real.

### Testes de Integração (`scripts/smoke.sh`)

Estender Cenário 1 com asserts:

- `find .cursor/skills -maxdepth 1 -type l ≥ 11`.
- `find .cursor/agents -maxdepth 1 -type l ≥ 3`.
- contagem de `.cursor/rules/*.mdc` ≥ contagem de `.agents/rules/*.md` resolvíveis.
- `CURSOR.md` existe; `code-standards.mdc` contém `alwaysApply: true`.
- Cenário 3 (idempotência) abrange agora `.cursor/` (symlinks + `.mdc` inalterados em 2º `update`).
- `prepublish-check.sh`: validar symlinks de `.cursor/skills`, `.cursor/agents`, `.cursor/templates`, `.cursor/validation` (excluir `.cursor/rules`, que é derivado).

### Testes de E2E

Manual (RF5): abrir projeto no Cursor Agent e invocar `kspec-version` e `kspec-prd` com sucesso; confirmar os 3 `subagent_type` disponíveis. Sem TestSprite (não há frontend).

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Conversor `.md → .mdc`** + testes unitários (núcleo isolado, sem efeitos colaterais).
2. **Funções Cursor em `install.ts`** (skills/agents/dir links + rules + report) e `paths.ts`.
3. **`CURSOR.md` + `cursor-md-template.md`** e extensão de `ensureRootDocs`.
4. **`migration.ts`** estendida + `output.ts`.
5. **`package.json`/`VERSION`** (files, versão, keywords).
6. **`scripts/smoke.sh` + `prepublish-check.sh`** atualizados.
7. **Docs/skills:** `kspec-bootstrap` (matriz tri-plataforma + MCP por plataforma), `kspec-version` (linha de plataformas), `AGENTS.md`/`CLAUDE.md`/`README.md`.

### Dependências Técnicas

- Nenhuma dependência externa nova; reutiliza `fs-extra`, `chalk`, `node:crypto`.
- Passo 2 depende do 1; passos 6–7 dependem de 2–5.

## Monitoramento e Observabilidade

CLI local — observabilidade = saída de console + testes.

### Error Tracking

Sem Sentry. Erros por `try/catch` em `runInstall`, acumulados em `report.errors` e impressos em vermelho; comando segue para não bloquear plataformas válidas (padrão atual de `buildCodexAgentsToml`).

### Logging Estruturado

Manter o padrão pt-BR existente: `→` (ação), `✓` (sucesso), `⚠` (aviso, ex. Windows/symlink quebrado), `✗` (erro). Nunca logar conteúdo sensível.

### Health Checks

`scripts/prepublish-check.sh` é o "health check" pré-release (todos os symlinks resolvem para `.agents/`). `smoke.sh` valida a estrutura pós-`init`/`update`.

### Métricas de Negócio

Sem instrumentação (telemetria fora de escopo no PRD). Métricas de aceite verificadas por smoke test: ≥11 skills, 3 agents, todas as rules regeneradas.

### Alertas

N/A (sem runtime de produção). Falha de smoke/prepublish = bloqueio de release.

## Considerações Técnicas

### Decisões Principais

- **Inline em `install.ts`** (não novo módulo): consistência com o código atual e menor superfície; trade-off aceito de um arquivo maior.
- **`.cursor/agents/` por symlink** (decisão do usuário): cria `.cursor/agents/<nome>` → `.agents/agents/<nome>`. Garante presença explícita exigida pelo critério "≥3 entradas em `.cursor/agents/`" (RF1.2). A descoberta via `.agents/agents/`/`.claude/agents/` permanece como reforço comprovado.
- **Heurística de frontmatter** (não mapa hardcoded): qualquer rule futura é convertida sem editar código; exceção única `code-standards → alwaysApply:true`.
- **`.cursor/rules` derivado, não symlink**: formato `.mdc` é incompatível com `.md` canônico, exigindo geração.

### Riscos Conhecidos

- **R1 — Symlink de diretório em `.cursor/agents/`/`.cursor/skills/` não é documentado pelo Cursor.** A estrutura kspec é `.agents/agents/<nome>/AGENT.md` (dir), e o Cursor pode esperar `.cursor/agents/<nome>.md` (arquivo único). *Mitigação:* a descoberta via `.agents/agents/` já funciona (comprovado nesta sessão); se o symlink não for lido, não há regressão — apenas o critério de "presença de entrada" é atendido visualmente. Reavaliar geração de `.md` derivado em release futura se o symlink se mostrar inerte.
- **R2 — `.mdc` órfão** após remoção de rule. *Mitigação:* poda em `buildCursorRulesMdc`.
- **R3 — Drift `.agents/`↔`.cursor/`** no tarball. *Mitigação:* `prepublish-check.sh` estendido.
- **R4 — Windows** sem symlink. *Mitigação:* `linkOrCopy` cópia + aviso (já existe).

### Conformidade com Skills Padrões

- `code-standards.md`: nomenclatura/SOLID nos novos helpers TypeScript.
- `logging.md`: padrão de mensagens pt-BR (`→/✓/⚠/✗`).
- `graphify.md`: não aplicável (sem grafo gerado neste repo).
- Sem `database.md`/`react.md` (sem DB/frontend nesta feature).

### Arquivos relevantes e dependentes

- `src/lib/install.ts` — orquestração + funções Cursor (núcleo).
- `src/lib/platform.ts` — `linkOrCopy`/`isOnWindows` (reuso).
- `src/lib/migration.ts` — detecção estendida para `.cursor/`.
- `src/utils/paths.ts` — resolvedores de fonte (`CURSOR.md`).
- `src/utils/output.ts` — sumário de instalação.
- `src/commands/init.ts`, `src/commands/update.ts` — invocam `runInstall` (sem mudança de assinatura).
- `scripts/smoke.sh`, `scripts/prepublish-check.sh` — validação.
- `package.json`, `VERSION` — distribuição/versão.
- `CURSOR.md`, `.agents/templates/cursor-md-template.md` — docs.
- `.agents/skills/kspec-bootstrap/SKILL.md`, `.agents/skills/kspec-version/SKILL.md`, `AGENTS.md`, `CLAUDE.md`, `README.md` — conteúdo.
