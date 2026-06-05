# PRD — Suporte ao Cursor no kspec

## Visão Geral

O **kspec** é um kit de specs, skills, agents, rules e templates para projetos que usam agentes de IA. Hoje suporta **Claude Code** (`.claude/`) e **OpenAI Codex CLI** (`.codex/`), com source of truth unificado em `.agents/`. Este PRD descreve a evolução para a versão **1.3.0**, que adiciona suporte ao **Cursor** como terceira plataforma de discovery, sem duplicar conteúdo e sem quebrar o suporte existente.

**Problema:** equipes que adotaram o Cursor como IDE principal de agentes de IA não conseguem reaproveitar o kit de skills do kspec de forma padronizada. Sem uma camada `.cursor/` gerenciada pela CLI, cada time reinventa rules (`.mdc`), instruções de projeto (`CURSOR.md`) e descoberta de skills — fragmentando governança de specs (PRD, tech spec, tasks, review, QA) em relação a quem usa Claude Code ou Codex CLI.

**Para quem:** desenvolvedores consumidores do kspec que rodam `kspec init`/`update` em seus projetos, especialmente times Cursor-only ou times mistos (Claude + Codex + Cursor).

**Valor:** com uma única instalação do kspec, o projeto-alvo passa a ter skills, agents e rules invocáveis no Cursor, com source of truth unificado em `.agents/` e camada de discovery em `.cursor/` (symlinks + artefatos derivados), em paridade com as demais plataformas.

## Objetivos

- **Cobertura funcional**: 100% das skills do kspec (9 skills `kspec-*` + skills empresariais, ex.: `cybersecurity-analyst`) e 3 agents acionáveis no Cursor em modo interativo (Agent chat).
- **Zero regressão**: Claude Code e Codex CLI continuam funcionando exatamente como na v1.2.x (`/kspec-*`, `$kspec-*`, symlinks, `.toml`).
- **Source of truth único**: `.agents/` permanece o único lugar editável. `.cursor/` é camada de discovery: symlinks para skills/templates/validation (e agents, se confirmado na Tech Spec) e rules derivadas em `.mdc`.
- **Bootstrap tri-plataforma**: `kspec-bootstrap` pergunta quais plataformas configurar (Claude Code / Codex CLI / Cursor / combinações, incluindo "Todas") e oferece opt-in de MCPs por plataforma.
- **Onboarding preservado**: `kspec init` em projeto vazio produz estrutura completa para a(s) plataforma(s) escolhida(s) em uma única execução.
- **Métrica de acompanhamento**: todas as skills descobertas (≥11 entradas em `.cursor/skills/`), 3/3 agents delegáveis via Task tool, todas as rules de `.agents/rules/` regeneradas em `.mdc` — verificadas via smoke tests automatizados pós-release.
- **Objetivo de negócio**: viabilizar uso do kspec em times Cursor-only e times mistos, ampliando adoção sem fork do repositório.

## Histórias de Usuário

**Persona primária — Dev Consumidor (Cursor-only):** desenvolvedor que usa Cursor Agent como assistente principal e quer padronizar specs no time.

- Como **dev Cursor-only**, quero rodar `kspec init` e ter as skills do kspec disponíveis no Cursor, para que eu não precise traduzir manualmente nenhum artefato.
- Como **dev Cursor-only**, quero invocar uma skill por linguagem natural ("crie um PRD para...") ou menção explícita (`kspec-prd`), para que o fluxo seja idiomático ao Cursor.
- Como **dev Cursor-only**, quero ler `CURSOR.md` na raiz e entender skills, agents, rules, limitações e como registrar MCPs.

**Persona primária — Dev Consumidor (Multiplataforma):** time que usa Claude Code, Codex CLI e/ou Cursor.

- Como **dev multiplataforma**, quero que um único `kspec init` configure as três plataformas, para evitar manutenção em paralelo.
- Como **dev multiplataforma**, quero que mudanças em `.agents/skills/<nome>/SKILL.md` reflitam automaticamente em Claude, Codex e Cursor.
- Como **dev multiplataforma**, quero rodar `kspec-bootstrap` e escolher "Todas" para gerar `CLAUDE.bootstrap.md`, `AGENTS.bootstrap.md` e `CURSOR.bootstrap.md`.

**Persona secundária — Dev Consumidor (legado Claude/Codex):** já usa kspec e atualiza para v1.3.0.

- Como **dev legado**, quero atualizar o kspec sem quebrar nada nas plataformas que já uso.
- Como **dev legado**, quero ser avisado quando `kspec init`/`update` detectar diretórios reais (não symlink) com modificações locais.

**Fluxos principais:**

1. **Init em projeto vazio (Todas)**: `kspec init` → CLI cria `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `CLAUDE.md`, `AGENTS.md`, `CURSOR.md`.
2. **Bootstrap em projeto existente**: usuário invoca `kspec-bootstrap` → escolhe plataforma(s) e MCP opt-in → gera artefatos correspondentes.
3. **Update após nova versão**: `kspec update` regenera symlinks, `.codex/agents/*.toml` e `.cursor/rules/*.mdc`.
4. **Invocação de skill**: Cursor via linguagem natural ou menção explícita; Claude via `/kspec-prd`; Codex via `$kspec-prd`.
5. **Delegação de agent**: `kspec-implement`/`kspec-qa` delegam via Task tool com `subagent_type` correspondente.
6. **Casos extremos**: Windows → fallback para cópia; `.cursor/rules/` editado manualmente → sobrescrito no próximo `update`.

## Funcionalidades Principais

### REQ-001 — Camada `.cursor/` como discovery

**O que faz:** adiciona `.cursor/` como camada de descoberta para o Cursor, apontando para `.agents/` via symlinks e gerando rules derivadas.

**Por que importa:** o Cursor descobre skills em `.cursor/skills/` e `.agents/skills/`; rules exigem formato `.mdc` com frontmatter — incompatível com `.md` canônico.

**Requisitos funcionais:**

- RF1.1 — `kspec init`/`update` cria symlinks para todas as skills (`.cursor/skills/<nome>` → `.agents/skills/<nome>`, incluindo skills `kspec-*` e empresariais), `.cursor/templates` → `.agents/templates` e `.cursor/validation` → `.agents/validation`.
- RF1.2 — **Premissa a validar na Tech Spec:** se o Cursor lê agents custom de `.cursor/agents/`, criar symlinks `.cursor/agents/<nome>` → `.agents/agents/<nome>`. Caso a descoberta de subagents já ocorra via `.agents/agents/` ou `.claude/agents/` (sem necessidade de `.cursor/agents/`), este requisito é dispensado para evitar over-engineering. Ver REQ-005 e Restrições Técnicas.
- RF1.3 — Todas as rules em `.agents/rules/*.md` (reais e symlinks empresariais) são convertidas para `.cursor/rules/*.mdc` com frontmatter (`description`, `alwaysApply` ou `globs`) e corpo preservado.
- RF1.4 — Conversão é idempotente: rodar `update` duas vezes produz o mesmo resultado (hash-based skip).
- RF1.5 — Em Windows, symlinks viram cópias com aviso documentado.
- RF1.6 — `.cursor/rules/*.mdc` são artefatos derivados — documentação instrui editar `.agents/rules/` e rodar `update`.

#### Critérios de Aceite

- Após `kspec init`, existem ≥11 symlinks em `.cursor/skills/` (9 `kspec-*` + empresariais).
- Cada `.md` em `.agents/rules/` gera um `.mdc` correspondente em `.cursor/rules/`.
- `code-standards.mdc` tem `alwaysApply: true`; demais rules têm `globs` ou `alwaysApply: false` conforme mapeamento por nome.
- Se RF1.2 for confirmado, existem ≥3 entradas em `.cursor/agents/`; caso contrário, a delegação de agents é validada conforme REQ-005.

---

### REQ-002 — Arquivo `CURSOR.md` na raiz

**O que faz:** equivalente ao `CLAUDE.md` e `AGENTS.md` para o Cursor; guia de projeto carregado como contexto.

**Requisitos funcionais:**

- RF2.1 — `CURSOR.md` lista cada skill com forma de invocação no Cursor (linguagem natural ou menção explícita).
- RF2.2 — Documenta delegação de agents via Task tool (`subagent_type`: `kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`).
- RF2.3 — Referencia rules por caminho canônico (`.agents/rules/`) e publicação Cursor (`.cursor/rules/*.mdc`).
- RF2.4 — Contém seção "Limitações conhecidas no Cursor": sem slash commands de projeto, delegação via Task tool, rules derivadas, Windows, MCP opt-in.
- RF2.5 — Documenta ferramenta interativa `AskQuestion` como equivalente ao `AskUserQuestion` (Claude) e `request_user_input` (Codex).
- RF2.6 — `CURSOR.md` é coerente com `CLAUDE.md` e `AGENTS.md` (mesma descrição do projeto, mesmos paths).

#### Critérios de Aceite

- `CURSOR.md` existe após `kspec init` e é listado em `package.json#files`.
- Template `cursor-md-template.md` disponível em `.agents/templates/` para bootstrap.

---

### REQ-003 — CLI tri-plataforma (`init`, `update`)

**O que faz:** estende `kspec init` e `kspec update` para gerar simultaneamente `.claude/`, `.codex/` e `.cursor/`.

**Requisitos funcionais:**

- RF3.1 — `kspec init` em projeto vazio gera `.agents/`, as três camadas de discovery, `CLAUDE.md`, `AGENTS.md` e `CURSOR.md`.
- RF3.2 — `kspec update` regenera symlinks, `.codex/agents/*.toml` e `.cursor/rules/*.mdc`; é idempotente.
- RF3.3 — Plano de migração e confirmação quando detectar diretórios reais com conteúdo local.
- RF3.4 — `package.json#files` inclui `.cursor/`, `CURSOR.md` e demais artefatos existentes.

#### Critérios de Aceite

- Smoke test: `kspec init` em diretório temporário produz estrutura completa com as três plataformas.
- `kspec update` não altera `settings.json`/`settings.local.json` do Claude Code.

---

### REQ-004 — Bootstrap tri-plataforma

**O que faz:** `kspec-bootstrap` pergunta quais plataformas configurar entre Claude Code, Codex CLI, Cursor e combinações.

**Requisitos funcionais:**

- RF4.1 — Pergunta "Quais plataformas devem ser configuradas?" com opções: Claude apenas, Codex apenas, Cursor apenas, combinações parciais e **Todas (Recomendado)**.
- RF4.2 — Conforme resposta, gera `CLAUDE.bootstrap.md`, `AGENTS.bootstrap.md`, `CURSOR.bootstrap.md` ou combinação — nunca sobrescreve arquivos finais existentes.
- RF4.3 — MCP opt-in **por plataforma**: Codex → `.codex/config.toml`; Cursor → `.cursor/mcp.json`; default **Não** em ambos.
- RF4.4 — Skills adaptam fallback de perguntas: `AskQuestion` no Cursor; texto numerado se ferramenta indisponível.
- RF4.5 — Bootstrap em modo não-interativo (Codex `exec`) documenta limitação e aborta com mensagem clara.

#### Critérios de Aceite

- Matriz de geração documentada na skill `kspec-bootstrap` cobre todas as combinações de 3 plataformas.
- Opt-in de MCP nunca grava config sem confirmação explícita do usuário.

---

### REQ-005 — Paridade de skills e agents

**O que faz:** garante que todas as skills e agents do kspec funcionem no Cursor com semântica equivalente às outras plataformas.

**Requisitos funcionais:**

- RF5.1 — As 9 skills `kspec-*` (`kspec-ideia` até `kspec-version`) são invocáveis no Cursor Agent.
- RF5.2 — `kspec-implement` delega `kspec-task-runner` e `kspec-review-runner` via Task tool; fallback inline com aviso se indisponível.
- RF5.3 — `kspec-qa` delega `kspec-qa-runner` via Task tool; mesmo fallback.
- RF5.4 — Refs `@.agents/...` em SKILL.md e AGENT.md permanecem canônicas (sem duplicação para Cursor).
- RF5.5 — `kspec-version` imprime "Plataformas suportadas: Claude Code, OpenAI Codex CLI, Cursor".
- RF5.6 — O mecanismo de descoberta de subagents custom (`kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`) no Cursor é definido na Tech Spec, confirmando a fonte lida pelo Cursor (`.agents/agents/`, `.claude/agents/` ou `.cursor/agents/`) — ver RF1.2.

#### Critérios de Aceite

- Smoke test automatizado (`scripts/smoke.sh`) estendido para validar: criação de `.cursor/`, symlinks de skills, geração de `.mdc` e presença de `CURSOR.md`.
- Smoke test manual complementar: invocar `kspec-prd` e `kspec-version` no Cursor Agent com sucesso.
- Nenhuma skill referencia caminhos exclusivos de uma única plataforma como source of truth.

---

### REQ-006 — Documentação e versionamento

**O que faz:** atualiza README, guias de plataforma, `kspec-version` e bump para **1.3.0**.

**Requisitos funcionais:**

- RF6.1 — README contém "Matriz de plataformas" com coluna Cursor (skills, agents, rules, invocação).
- RF6.2 — `AGENTS.md`, `CLAUDE.md` e `CURSOR.md` listam limitações específicas de cada plataforma.
- RF6.3 — `package.json` e `VERSION` em **1.3.0**; `description` e `keywords` incluem `cursor`.
- RF6.4 — *(N/A nesta release — não há adição de skills empresariais. Caso a release passe a incluí-las, atualizar `enterprise-skills-lock.json`.)*

#### Critérios de Aceite

- README referencia as três plataformas com tabela comparativa de invocação e discovery paths.
- Release notes mencionam Cursor como nova plataforma suportada.

## Experiência do Usuário

**Fluxos principais:**

1. **Onboarding inicial:** `npm i -g @k77-dev/kspec@1.3.0` → `kspec init` → estrutura gerada → leitura de `CURSOR.md` → primeiro "crie um PRD para...".
2. **Adoção em projeto existente:** `kspec-bootstrap` → escolhe plataforma(s) → revisa `*.bootstrap.md` → renomeia para arquivo final.
3. **Atualização:** `kspec update` → symlinks, `.toml` e `.mdc` regenerados.
4. **Inspeção:** "qual a versão do kspec?" → `kspec-version` lista skills, agents e plataformas.

**UI/UX e acessibilidade:**

- CLI emite mensagens em pt-BR (`→`, `✓`, `✗`).
- `AskQuestion` usado no Cursor para escolhas estruturadas (bootstrap, PRD, techspec).
- Documentação Markdown com hierarquia clara, tabelas comparativas e fenced code blocks com linguagem declarada.
- Mensagens de erro descrevem causa e próxima ação (ex.: "edite `.agents/rules/`, não `.cursor/rules/`").

## Restrições Técnicas de Alto Nível

- **Compatibilidade retroativa:** zero regressão em Claude Code e Codex CLI.
- **Discovery do Cursor:** o Cursor carrega skills de `.agents/skills/`, `.cursor/skills/`, `.claude/skills/` e `.codex/skills/` — symlinks em `.cursor/skills/` reforçam discovery e paridade visual.
- **Rules derivadas:** todas as `.agents/rules/*.md` (reais + symlinks empresariais, formato Claude) → `.cursor/rules/*.mdc` (formato Cursor); mapeamento de `paths` frontmatter para `globs` e defaults por nome de rule.
- **Agents no Cursor (premissa a confirmar):** não há formato proprietário equivalente ao `.toml` do Codex. A delegação ocorre via Task tool com `subagent_type` (`kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`). A fonte de descoberta desses subagents pelo Cursor (`.agents/agents/`, `.claude/agents/` ou `.cursor/agents/`) **deve ser validada na Tech Spec** antes de decidir se `.cursor/agents/` symlinks são necessários (RF1.2/RF5.6).
- **Ferramenta interativa:** `AskQuestion` no Cursor; fallback para opções numeradas em texto.
- **MCP:** configuração via `.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global); sem descoberta automática; opt-in explícito no bootstrap.
- **Windows:** fallback de cópia para symlinks; sincronização manual documentada.
- **Distribuição:** tarball npm inclui `.agents/`, `.claude/`, `.codex/`, `.cursor/`, `CURSOR.md`, `AGENTS.md`, `CLAUDE.md`, `VERSION`, `README.md`.
- **Versão:** bump 1.2.x → **1.3.0** (minor — nova plataforma, retrocompatível).

## Fora de Escopo

- **Cursor Cloud Agents / background agents** — execução remota assíncrona fora do Agent chat local.
- **Cursor Automations** (`.cursor/automations/`) — workflows agendados ou disparados por eventos.
- **Cursor Hooks** (`.cursor/hooks.json`) — automação de ciclo de vida de sessão.
- **Slash commands de projeto no Cursor** — o Cursor não suporta `/kspec-prd` como comando de projeto; invocação permanece por linguagem natural ou `/skill-name` nativo do Cursor quando aplicável.
- **Registro automático de MCP** sem opt-in do usuário.
- **Substituição unificada de ferramentas interativas** (`AskUserQuestion` / `request_user_input` / `AskQuestion`) por mecanismo agnóstico — release futura.
- **Suporte a outros assistentes** (Cline, Windsurf, GitHub Copilot Workspace) — fora desta release.
- **Telemetria de adoção** por plataforma — sem instrumentação no MVP.

*(Nota: riscos de implementação técnica, estratégia de PRs e detalhes de conversão `.md` → `.mdc` serão detalhados na Tech Spec.)*
