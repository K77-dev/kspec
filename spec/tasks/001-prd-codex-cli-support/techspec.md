# Tech Spec — Suporte ao OpenAI Codex CLI no kspec

## Resumo Executivo

A estratégia técnica desta release consiste em **promover `.agents/` a source of truth físico** e transformar `.claude/` e `.codex/` em **camadas finas de discovery via symlinks**, eliminando duplicação e dando suporte ao Codex CLI "de graça" para o componente principal (skills). Os 3 agents — único formato não-compatível entre as plataformas — passam a ser gerados em `.codex/agents/<nome>.toml` a partir de `.agents/agents/<nome>/AGENT.md` pela própria CLI (`init`/`update`). Um novo `AGENTS.md` raiz fornece ao Codex o contexto equivalente ao `CLAUDE.md`.

A CLI ganha três responsabilidades novas: (1) instalar a árvore `.agents/`, (2) construir symlinks idempotentes em `.claude/` e `.codex/` com fallback para cópia em Windows, e (3) parsear `AGENT.md` e emitir TOML. A `kspec-bootstrap` passa a perguntar quais plataformas configurar via `AskUserQuestion`. Não há mudanças no formato das skills/templates — são Markdown agnóstico já compatível com ambos os runtimes.

## Arquitetura do Sistema

### Visão Geral dos Componentes

**Componentes novos**
- `src/lib/agent-toml.ts` — parser de frontmatter YAML e gerador de TOML a partir de `AGENT.md`. Sem libs externas (regex + template literal com escape mínimo).
- `src/lib/platform.ts` — abstração `linkOrCopy(source, dest)` que cria symlink em POSIX e cópia recursiva em `process.platform === 'win32'`.
- `src/lib/migration.ts` — detecta `.claude/<sub>` como diretório real (não symlink), gera plano numerado e pede confirmação.
- `src/lib/install.ts` — orquestrador comum a `init` e `update`: copia `.agents/`, gera symlinks `.claude/{skills,agents,rules,templates,validation}` e `.codex/skills/<nome>`, regenera `.codex/agents/*.toml`, copia `AGENTS.md` se ausente.

**Componentes modificados**
- `src/commands/init.ts` — passa a delegar para `install.ts` (com prompt de migração via `migration.ts` quando aplicável).
- `src/commands/update.ts` — idem; ganha checagem de idempotência baseada em `fs.lstat` (symlinks já corretos não são recriados).
- `src/commands/version.ts` — agrega `.agents/skills/*/SKILL.md` (fonte canônica) e imprime "Plataformas suportadas: Claude Code, OpenAI Codex CLI".
- `src/utils/paths.ts` — adiciona `getAgentsSourceDir()`, `getCodexSourceDir()`, `getAgentsMdSource()`.
- `src/utils/prompt.ts` — mantém `confirm()`; ganha `prompt()` simples para input texto livre (utilizado pela migração).

**Componentes de conteúdo (movidos para `.agents/`)**
- 9 skills (`.agents/skills/<nome>/SKILL.md`), 3 agents (`.agents/agents/<nome>/AGENT.md`), 4 rules (`.agents/rules/*.md`), 6 templates (`.agents/templates/*.md`), 1 validation (`.agents/validation/enterprise-skills-check.md`).
- Refs `@.claude/...` em SKILL/AGENT reescritas para `@.agents/...` (22 ocorrências, validadas em `doc/prompt-codex.md` §1.2).

**Componentes inalterados**
- 6 templates Markdown (`prd-template.md`, `techspec-template.md`, etc.) — neutros entre plataformas.
- `enterprise-skills-check.md` mantém algoritmo de hash; ganha um terceiro symlink em `.codex/skills/`.

### Fluxo de dados (alto nível)

```
@k77-dev/kspec tarball
   └── .agents/  (canônico)
   └── .claude/, .codex/ (camadas pré-construídas do pacote)
   └── AGENTS.md, CLAUDE.md (templates)

kspec init / update (projeto-alvo)
   1. copia .agents/        (fs-extra.copy)
   2. para cada skill/agent: linkOrCopy → .claude/<tipo>/<nome>
   3. para cada agent: gera .codex/agents/<nome>.toml
   4. para cada skill: linkOrCopy → .codex/skills/<nome>
   5. ensure AGENTS.md, CLAUDE.md  (sem sobrescrever existentes)
```

## Design de Implementação

### Interfaces Principais

```typescript
// src/lib/agent-toml.ts
interface AgentFrontmatter {
  name: string;
  description: string;
}
interface AgentDocument {
  frontmatter: AgentFrontmatter;
  body: string;
}
function parseAgentFile(filePath: string): AgentDocument;
function renderAgentToml(doc: AgentDocument, sandboxMode: SandboxMode): string;

// src/lib/platform.ts
type LinkResult = "symlinked" | "copied" | "skipped-idempotent";
function linkOrCopy(source: string, destination: string): Promise<LinkResult>;
function isOnWindows(): boolean;

// src/lib/migration.ts
interface MigrationPlan {
  realDirs: string[];          // .claude/<sub> que são dirs reais
  filesPreserved: string[];    // settings.json, settings.local.json
  actions: string[];           // linhas numeradas para exibição
}
function detectMigration(targetClaude: string): Promise<MigrationPlan | null>;
function confirmMigration(plan: MigrationPlan): Promise<boolean>;

// src/lib/install.ts
interface InstallOptions { force?: boolean; }
function runInstall(opts: InstallOptions): Promise<InstallReport>;
```

### Modelos de Dados

**Frontmatter de AGENT.md** (entrada do parser)
```yaml
---
name: kspec-task-runner            # obrigatório
version: 1.0.0                     # ignorado por Codex (preservado)
description: ...                   # obrigatório (vira description do TOML)
---
```

**TOML de agent Codex** (saída)
```toml
name = "kspec-task-runner"
description = "..."                # do frontmatter; string TOML escapada
sandbox_mode = "workspace-write"   # do mapa explícito
developer_instructions = """
<corpo Markdown completo do AGENT.md>
"""
```

**Mapa de sandbox** (constante hardcoded em `agent-toml.ts`)
```typescript
const SANDBOX_BY_AGENT: Record<string, SandboxMode> = {
  "kspec-task-runner": "workspace-write",
  "kspec-review-runner": "read-only",
  "kspec-qa-runner": "workspace-write",
};
```
Agents não mapeados (extensões empresariais futuras) recebem default `workspace-write` e geram aviso no stdout.

**Estrutura de saída no projeto-alvo**
```
.agents/                    real (cópia do tarball)
.claude/
  ├── skills/<nome>         symlink → ../../.agents/skills/<nome>
  ├── agents/<nome>         symlink → ../../.agents/agents/<nome>
  ├── rules                 symlink → ../.agents/rules
  ├── templates             symlink → ../.agents/templates
  ├── validation            symlink → ../.agents/validation
  ├── settings.json         arquivo real (NUNCA symlink)
  └── settings.local.json   arquivo real (NUNCA symlink)
.codex/
  ├── skills/<nome>         symlink → ../../.agents/skills/<nome>
  ├── agents/<nome>.toml    arquivo real (gerado)
  └── config.toml           arquivo real (opcional, criado por bootstrap)
AGENTS.md                   arquivo real (se ausente)
CLAUDE.md                   arquivo real (se ausente)
```

### Endpoints de API

N/A. Este projeto é uma CLI distribuída via npm. Os "endpoints" são os subcomandos:

| Comando | Comportamento novo |
| --- | --- |
| `kspec init` | Instala `.agents/`, gera symlinks `.claude/` e `.codex/`, gera `.codex/agents/*.toml`, escreve `AGENTS.md`/`CLAUDE.md` se ausentes. Detecta migração e pede confirmação (RF4.4). |
| `kspec update` | Mesmo fluxo de `init`, idempotente (RF4.2). Preserva `.claude/settings*.json`. Regenera todos os `.toml` para refletir mudanças upstream em `AGENT.md`. |
| `kspec version` | Saída inclui `Plataformas suportadas: Claude Code, OpenAI Codex CLI`. |

## Pontos de Integração

- **Codex CLI**: integração estática via `AGENTS.md` (carregado automaticamente da raiz), `.agents/skills/` (discovery nativo, prioridade 2), `.codex/skills/` (prioridade 3, reforço quando `--cwd` aponta para subdiretório), `.codex/agents/*.toml` (formato obrigatório para agents Codex). Não há chamada de rede.
- **Claude Code**: integração estática via `.claude/` (skills, agents, rules, templates) e `CLAUDE.md`. Symlinks são resolvidos transparentemente pelo runtime do Claude Code.
- **MCP servers** (opt-in via bootstrap): `.codex/config.toml` lista `[mcp_servers.context7]` e `[mcp_servers.testsprite]` com `command = "npx"` e `args = ["-y", "<pacote>"]`. Codex CLI carrega e dispara o subprocess sob demanda.
- **npm registry**: distribuição inalterada (`@k77-dev/kspec`); `package.json#files` passa a incluir `.agents/`, `.codex/`, `AGENTS.md`.

## Verificações Técnicas

### Segurança

- **Symlink target escape**: todos os symlinks usam paths relativos (`../../.agents/skills/<nome>`), nunca absolutos, evitando vazamento de caminho do host no tarball.
- **Sanitização de TOML**: `description` é escapada para string TOML básica (replace `\` → `\\`, `"` → `\"`); `developer_instructions` usa string literal multi-linha (`"""..."""`) com guard contra ocorrências literais de `"""` no corpo (regex assertion em testes).
- **Sem execução de código arbitrário**: o parser de frontmatter aceita apenas `name:` e `description:` em formato chave-valor simples; qualquer YAML mais complexo é rejeitado com erro claro.
- **Preservação de `settings*.json`**: a CLI verifica explicitamente que esses arquivos são `isFile()` antes de qualquer ação; nunca os converte em symlinks.

### Arquitetura

- **Source of truth único**: zero duplicação. Mudança em `.agents/skills/<nome>/SKILL.md` reflete em ambos os CLIs imediatamente (via symlink).
- **Falha localizada**: erro ao gerar um `.toml` não bloqueia os demais; CLI reporta o agent específico e continua (degradação parcial).
- **Idempotência**: `update` compara `fs.readlink(dest)` com o target esperado; só recria se divergir. Para arquivos gerados (TOML), compara hash do conteúdo antes de reescrever.
- **Limites de responsabilidade**: `agent-toml.ts` faz parse+render puro (sem I/O lateral além de leitura do arquivo de origem). `platform.ts` é a única camada que conhece `process.platform`. `install.ts` orquestra; comandos só fazem parsing de args e tratamento de erros.

### Infraestrutura

- **Requisito de runtime**: Node.js ≥ 18 (já declarado em `package.json#engines`).
- **Sem deploy de servidor**: distribuição via `npm publish`. Pipeline mínimo: `npm run build` → `npm publish`.
- **Compatibilidade de FS**: symlinks exigem POSIX. Em Windows, `linkOrCopy()` copia recursivamente — quando o usuário rodar `kspec update`, o conteúdo é resincronizado. Limitação documentada em README e `AGENTS.md`.
- **Rollback**: a release 1.2.0 é retrocompatível para consumidores Claude-only — basta `npm i -g @k77-dev/kspec@1.1.3` para voltar. Para o projeto-alvo, `kspec update` re-aplica a estrutura correta.

## Abordagem de Testes

### Testes Unidade

Framework: **Vitest** (adicionar como devDep; script `test`/`test:watch`).

- `agent-toml.spec.ts`:
  - Parseia frontmatter mínimo (`name`/`description`) com sucesso.
  - Rejeita frontmatter ausente ou malformado com erro descritivo.
  - Renderiza TOML com `description` contendo aspas, barras invertidas, quebras de linha.
  - Renderiza `developer_instructions` com corpo que contém `"""` (deve falhar de modo controlado ou escapar).
  - Aplica mapa explícito de sandbox (`task-runner` → `workspace-write`, `review-runner` → `read-only`, `qa-runner` → `workspace-write`).
  - Agent fora do mapa recebe default + warning.
- `platform.spec.ts`:
  - `linkOrCopy` cria symlink relativo em POSIX (teste só roda se `process.platform !== 'win32'`).
  - `linkOrCopy` copia recursivamente em Windows (mocka `process.platform` ou usa `vi.stubGlobal`).
  - Idempotência: 2ª chamada com mesmo source/dest retorna `skipped-idempotent`.
- `migration.spec.ts`:
  - Detecta `.claude/skills/` como diretório real e popula `realDirs`.
  - Não detecta nada quando tudo já é symlink (`MigrationPlan === null`).
  - Preserva `settings.json` e `settings.local.json` em `filesPreserved`.

Mocks: nenhum mock de FS (usar `os.tmpdir()` real). Mock de `process.platform` apenas onde inevitável.

### Testes de Integração

Script `npm run smoke` em shell (`scripts/smoke.sh`), executado manualmente antes de release e idealmente em CI:

1. `mkdir -p /tmp/kspec-smoke && cd /tmp/kspec-smoke && npm init -y`
2. `npm link @k77-dev/kspec && kspec init`
3. Asserts:
   - `find .agents -type f | wc -l ≥ 23`
   - `find .claude -maxdepth 2 -type l | wc -l ≥ 12`
   - `[ -f .codex/agents/kspec-task-runner.toml ]`
   - `grep -q 'sandbox_mode = "workspace-write"' .codex/agents/kspec-task-runner.toml`
   - `grep -q 'sandbox_mode = "read-only"' .codex/agents/kspec-review-runner.toml`
   - `[ -f AGENTS.md ] && [ -f CLAUDE.md ]`
4. Cenário de migração: criar `.claude/skills/` como dir real com arquivo dummy → `kspec init` deve abortar sem `--force` e exibir plano. Validar com resposta "n" no prompt.
5. Idempotência: rodar `kspec update` 2× seguidas; diff de `find . -type l -ls` deve ser zero.

### Testes de E2E

E2E real exige instalação dos CLIs (`claude` e `codex`) — fora do alcance automatizável neste MVP. Substituído por **checklist manual** documentado em `doc/release-checklist.md`:

- Claude Code: invocar `/kspec-version` no projeto kspec → lista 9 skills.
- Claude Code: invocar `/kspec-prd test` → resolve template via symlink `.claude/templates`.
- Codex CLI: `cd <projeto> && codex` → exibe `AGENTS.md` carregado.
- Codex CLI: digitar `$kspec-version` → skill encontrada e executada.
- Codex CLI: invocar agent via `$kspec-task-runner` → TOML carregado, sandbox aplicado.

Não usar TestSprite — projeto é CLI sem frontend.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **PR-1 — Migração estrutural (sem CLI)**: criar `.agents/` real (cópia), reescrever 22 refs `@.claude/...` → `@.agents/...` nas cópias, escrever `AGENTS.md` raiz, gerar 3 `.toml` manualmente como fixtures, substituir `.claude/<sub>` e `.codex/skills/<sub>` por symlinks. Atualizar `CLAUDE.md` para refletir a nova arquitetura. Critério de pronto: Claude Code continua funcionando via symlinks; Codex CLI carrega `AGENTS.md` e skills.
2. **PR-2 — CLI multiplataforma**: implementar `src/lib/agent-toml.ts`, `platform.ts`, `migration.ts`, `install.ts`; refatorar `init.ts` e `update.ts` para usar a nova orquestração; atualizar `package.json#files`; adicionar testes Vitest; estender `kspec-bootstrap` SKILL.md com pergunta de plataforma e MCP opt-in. Critério de pronto: smoke shell passa em macOS/Linux; testes unit verdes; tarball inclui `.agents/`, `.claude/`, `.codex/`, `AGENTS.md`.
3. **PR-3 — Housekeeping e release**: atualizar `kspec-version` SKILL.md (varredura `.agents/skills/`), README com matriz de plataformas + limitações, bump 1.1.3 → 1.2.0 (`VERSION` + `package.json`), publicação. Critério de pronto: `npm view @k77-dev/kspec version` = `1.2.0`.

### Dependências Técnicas

- Vitest devDep (PR-2).
- Nenhuma infraestrutura externa nova.
- Suposições validadas no `doc/prompt-codex.md`: Codex CLI varre `.agents/skills/` nativamente; `version` e `argument-hint` no frontmatter são ignorados sem erro; `sandbox_mode` e `developer_instructions` são chaves esperadas no TOML.

## Monitoramento e Observabilidade

Aplicação é uma CLI executada localmente; observabilidade reduz-se a UX de console.

### Error Tracking

Captura de erros centralizada em `src/index.ts#handleError` (já existente). Em falha de symlink, falha de parse de AGENT.md, ou recusa de migração: exibir mensagem em `chalk.red("Erro: ...")` com causa e ação concreta sugerida. `process.exit(1)`. Sem integração com Sentry/Bugsnag (overkill para CLI offline).

### Logging Estruturado

Saída humana, pt-BR, prefixos `→`/`✓`/`✗` (padrão existente do projeto). Sem log estruturado JSON — não há agregador. Eventos relevantes:

- `→ Instalando .agents/...`
- `✓ Symlink criado: .claude/skills/kspec-prd → ../../.agents/skills/kspec-prd`
- `✓ Gerado: .codex/agents/kspec-task-runner.toml (sandbox=workspace-write)`
- `⚠ Windows detectado — usando cópia em vez de symlinks`
- `✗ Migração cancelada pelo usuário`

Sem PII em logs (não há dados de usuário). Caminhos de FS são esperados e não-sensíveis.

### Health Checks

N/A (CLI). O análogo é `kspec version` — usuário pode rodar manualmente para confirmar instalação.

### Métricas de Negócio

Sem instrumentação no MVP (PRD §Fora de Escopo). Métrica de adoção será observada externamente via `npm view @k77-dev/kspec` downloads.

### Alertas

N/A.

## Considerações Técnicas

### Decisões Principais

- **Parser de AGENT.md custom (sem libs)**: regex `^---\n([\s\S]*?)\n---\n` + parse linha-a-linha de `name:`/`description:`. Decisão: zero dependências runtime, controle total sobre erros descritivos. Trade-off: parser não cobre YAML genérico (aceitável — frontmatter é controlado e documentado).
- **Mapa explícito de sandbox (RF3.2)**: dicionário hardcoded por nome de agent. Auditável e seguro. Trade-off: agents enterprise futuros precisam de atualização do CLI; o default `workspace-write` + warning evita crash silencioso.
- **Symlinks relativos**: `../../.agents/skills/<nome>`. Funcionam após `npm pack` e `kspec init` em qualquer prefixo. Absoluto vazaria o `$HOME` do publisher no tarball.
- **Migração com confirmação (RF4.4)**: detecta `.claude/<sub>` como diretório real, lista plano numerado, lê resposta via `readline`. Aborta em "n". Trade-off: bloqueia `kspec init --force` somente quando há trabalho do usuário a destruir; com `--force` sobrescreve sem perguntar (consistente com flag existente).
- **Fallback Windows por cópia**: `linkOrCopy` checa `process.platform === 'win32'` e usa `fs-extra.copy`. Sincronização manual após `update` documentada. Trade-off: arquivos em `.claude/` no Windows podem divergir de `.agents/` se editados localmente, mas isso é detectável e o usuário foi avisado.

### Riscos Conhecidos

- **R1. `npm pack` e symlinks**: o tarball gerado pelo npm preserva symlinks. Mitigação: smoke test em CI (`npm pack && tar -tvf *.tgz | grep '^l'` deve mostrar links).
- **R2. Hooks de Claude Code interpretando paths de symlink**: alguns hooks usam `realpath`. Mitigação: `.claude/settings.json` permanece arquivo real; testar `/kspec-prd test` e confirmar resolução do template.
- **R3. Codex `developer_instructions` muito grande**: agents têm até 236 linhas (`kspec-qa-runner`). Limite de tamanho do TOML não documentado oficialmente. Mitigação: smoke E2E manual com cada agent; se truncar, sub-dividir agent em release futura.
- **R4. Skill empresarial define seu próprio agent**: o algoritmo de enterprise-skills-check precisa também regenerar `.codex/agents/<nome>.toml`. Mitigação: extender `.agents/validation/enterprise-skills-check.md` (PR-2) para chamar o gerador.
- **R5. Drift entre `.agents/`, `.claude/`, `.codex/` no tarball**: a build do pacote depende de o publisher rodar `kspec update` localmente antes de `npm publish`. Mitigação: hook `prepublishOnly` valida que symlinks em `.claude/` e `.codex/` resolvem para `.agents/` (script `scripts/prepublish-check.sh`).

### Conformidade com Skills Padrões

Stack do projeto é TypeScript ESM (Node ≥ 18). Skills/rules aplicáveis da tabela em `CLAUDE.md`:

- **`.claude/rules/code-standards.md`** — nomenclatura em inglês, kebab-case para arquivos, camelCase para funções, evitar parâmetros > 3 (criar `interface` quando necessário). Aplicar a todos os arquivos novos em `src/lib/`.
- **`.claude/rules/logging.md`** — usar prefixos `→`/`✓`/`✗` em pt-BR (já é o padrão do projeto).
- **`.claude/rules/graphify.md`** — não aplicável (kspec é pequeno o suficiente; sem `graphify-out/`).

Rules enterprise (`languages/typescript`, `testing/tests`, etc.) não são consumidas pelo próprio kspec — o repo é o produtor desses padrões, não consumidor.

### Arquivos relevantes e dependentes

**Modificados (CLI)**
- `src/index.ts`
- `src/commands/init.ts`
- `src/commands/update.ts`
- `src/commands/version.ts`
- `src/utils/paths.ts`
- `src/utils/files.ts`
- `src/utils/prompt.ts`

**Novos (CLI)**
- `src/lib/agent-toml.ts`
- `src/lib/platform.ts`
- `src/lib/migration.ts`
- `src/lib/install.ts`
- `tests/agent-toml.spec.ts`
- `tests/platform.spec.ts`
- `tests/migration.spec.ts`
- `scripts/smoke.sh`
- `scripts/prepublish-check.sh`

**Modificados (config)**
- `package.json` (`files`, `description`, `keywords`, `version`, `scripts.test`, `scripts.smoke`, `devDependencies.vitest`)
- `VERSION` (→ `1.2.0`)
- `CLAUDE.md` (estrutura do projeto, nota sobre `AGENTS.md`)
- `README.md` (matriz de plataformas, limitações)
- `tsconfig.json` (incluir `tests/` se necessário)

**Movidos / reescritos (conteúdo)**
- `.claude/skills/*/SKILL.md` → `.agents/skills/*/SKILL.md` (9 arquivos, refs reescritas)
- `.claude/agents/*/AGENT.md` → `.agents/agents/*/AGENT.md` (3 arquivos, refs reescritas)
- `.claude/rules/*.md` → `.agents/rules/*.md` (4 arquivos)
- `.claude/templates/*.md` → `.agents/templates/*.md` (6 arquivos)
- `.claude/validation/enterprise-skills-check.md` → `.agents/validation/enterprise-skills-check.md` (ajustado para criar symlink em `.codex/skills/` também)
- `.agents/skills/kspec-bootstrap/SKILL.md` — adicionar perguntas de plataforma e MCP opt-in
- `.agents/skills/kspec-version/SKILL.md` — varredura passa a apontar para `.agents/skills/`

**Novos (conteúdo)**
- `AGENTS.md` (raiz)
- `.codex/agents/kspec-task-runner.toml`
- `.codex/agents/kspec-review-runner.toml`
- `.codex/agents/kspec-qa-runner.toml`
- `.codex/skills/<nome>` (9 symlinks)
- `.codex/config.toml` (opcional, gerado por bootstrap quando MCP=Sim)

**Estrutura final em `.claude/` (após PR-1)**
- `.claude/skills/<nome>` → symlinks (9)
- `.claude/agents/<nome>` → symlinks (3)
- `.claude/rules`, `.claude/templates`, `.claude/validation` → symlinks de diretório
- `.claude/settings.json`, `.claude/settings.local.json` → arquivos reais preservados
