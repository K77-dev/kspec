# PRD — Suporte ao OpenAI Codex CLI no kspec

## Visão Geral

O **kspec** é um kit de specs, skills, agents, rules e templates para projetos que usam agentes de IA. Hoje suporta apenas **Claude Code** via `.claude/`. Este PRD descreve a evolução para a versão **1.2.0**, que adiciona suporte ao **OpenAI Codex CLI** sem duplicar conteúdo e sem quebrar o suporte existente.

**Problema:** equipes que usam Codex CLI (ou times mistos Claude/Codex) não conseguem reaproveitar o kit de skills do kspec. Forçar escolha de plataforma fragmenta padrões internos (PRD, tech spec, tasks, review, QA) e impede consolidação de governança de specs.

**Para quem:** desenvolvedores consumidores do kspec que rodam `kspec init`/`update` em seus projetos, especialmente times que adotaram ou estão avaliando Codex CLI como alternativa/complemento ao Claude Code.

**Valor:** com uma única instalação do kspec, o projeto-alvo passa a ter skills, agents e rules invocáveis pelos dois CLIs, com source of truth unificado em `.agents/` e camadas finas de discovery em `.claude/` e `.codex/` via symlinks.

## Objetivos

- **Cobertura funcional**: 100% das 9 skills e 3 agents invocáveis no Codex CLI em modo interativo; mínimo de 3 skills funcionais em `codex exec` (não-interativo).
- **Zero regressão no Claude Code**: todas as skills, agents, rules e templates continuam funcionando exatamente como hoje (`/kspec-*`, contexto isolado de agents, refs `@.agents/...`).
- **Source of truth único**: `.agents/` passa a ser o único lugar onde conteúdo de skills/agents/rules/templates é editado. `.claude/` e `.codex/` são camadas de discovery por symlink (com fallback de cópia em Windows).
- **Bootstrap multiplataforma**: `kspec-bootstrap` pergunta ao usuário quais plataformas configurar (Claude Code / Codex CLI / Ambas) e quais MCPs registrar.
- **Onboarding preservado**: `kspec init` em projeto vazio produz estrutura completa para a(s) plataforma(s) escolhida(s) em uma única execução.
- **Métrica de acompanhamento**: número de skills/agents invocáveis no Codex (alvo: 12/12 interativo, ≥3/9 exec) verificada via smoke tests pós-release.
- **Objetivo de negócio**: viabilizar uso do kspec em times Codex-only e times mistos, ampliando a base de adoção sem fork do repositório.

## Histórias de Usuário

**Persona primária — Dev Consumidor (Codex-only):** desenvolvedor que adotou Codex CLI como assistente principal e quer padronizar specs no time.

- Como **dev Codex-only**, quero rodar `kspec init` e ter as skills do kspec disponíveis no Codex CLI, para que eu não precise traduzir manualmente nenhum artefato.
- Como **dev Codex-only**, quero invocar uma skill com `$kspec-prd` ou linguagem natural ("crie um PRD para..."), para que o fluxo seja idiomático ao Codex.
- Como **dev Codex-only**, quero ler `AGENTS.md` na raiz do meu projeto e entender quais skills existem, como invocá-las e quais limitações existem em `codex exec`.

**Persona primária — Dev Consumidor (Multiplataforma):** desenvolvedor em time que usa tanto Claude Code quanto Codex CLI.

- Como **dev multiplataforma**, quero que um único `kspec init` configure ambas as plataformas, para evitar manutenção em paralelo.
- Como **dev multiplataforma**, quero que mudanças em uma skill (`.agents/skills/<nome>/SKILL.md`) sejam refletidas automaticamente em ambos os CLIs, para garantir paridade.
- Como **dev multiplataforma**, quero rodar `kspec-bootstrap` em um projeto existente e escolher "Ambas" para gerar `CLAUDE.bootstrap.md` e `AGENTS.bootstrap.md` adequados ao projeto.

**Persona secundária — Dev Consumidor (Claude-only, legado):** já usa kspec hoje e atualiza para v1.2.0.

- Como **dev Claude-only**, quero atualizar o kspec sem quebrar nada, para continuar usando `/kspec-*` exatamente como antes.
- Como **dev Claude-only**, quero ser avisado quando `kspec init`/`update` detectar `.claude/` real (não symlink) com modificações locais, para decidir se migro ou abortar.

**Fluxos principais:**

1. **Init em projeto vazio (Ambas)**: `kspec init` → CLI cria `.agents/`, `.claude/` (symlinks), `.codex/` (symlinks + `.toml`), `AGENTS.md`, `CLAUDE.md`.
2. **Bootstrap em projeto existente**: usuário invoca `kspec-bootstrap` → skill pergunta plataforma e MCP opt-in → gera artefatos correspondentes.
3. **Update após nova versão**: `kspec update` regenera symlinks e `.codex/agents/*.toml`, preservando `settings.json` e `settings.local.json` do Claude Code.
4. **Invocação de skill**: no Claude Code via `/kspec-prd`; no Codex CLI via `$kspec-prd` ou linguagem natural.
5. **Casos extremos**: projeto com `.claude/` real → CLI mostra plano de migração e pede confirmação; Windows → CLI faz fallback para cópia.

## Funcionalidades Principais

### F1. Reestruturação para `.agents/` como source of truth

**O que faz:** consolida todo conteúdo editável (skills, agents, rules, templates, validation) em `.agents/`. `.claude/` e `.codex/` viram camadas de descoberta por symlink.

**Por que importa:** elimina duplicação, evita drift entre plataformas, simplifica manutenção.

**Como funciona (alto nível):** o conteúdo vive em `.agents/`. A CLI cria symlinks em `.claude/<tipo>/<nome>` e `.codex/skills/<nome>` apontando para `.agents/`. Em Windows, copia arquivos.

**Requisitos funcionais:**
- RF1.1 — Todas as refs `@.claude/...` em SKILL.md e AGENT.md são substituídas por `@.agents/...`.
- RF1.2 — Após o release, `find .agents -type f` retorna todos os arquivos canônicos (≥23 considerando o estado atual).
- RF1.3 — `find .claude -maxdepth 2 -type l` em macOS/Linux retorna pelo menos 12 entradas (9 skills + 3 agents) mais 3 symlinks de diretório (rules, templates, validation).
- RF1.4 — `.claude/settings.json` e `.claude/settings.local.json` permanecem arquivos reais (nunca viram symlink).

### F2. Arquivo `AGENTS.md` na raiz

**O que faz:** equivalente ao `CLAUDE.md` para o Codex CLI; descreve estrutura, skills disponíveis, regras, limitações.

**Por que importa:** o Codex CLI carrega `AGENTS.md` automaticamente do diretório raiz; sem ele, o agente não tem contexto do projeto.

**Como funciona:** arquivo Markdown único na raiz, gerado pela CLI e atualizado em updates.

**Requisitos funcionais:**
- RF2.1 — `AGENTS.md` lista cada skill com forma de invocação para Codex (`$kspec-<nome>` ou linguagem natural).
- RF2.2 — `AGENTS.md` referencia rules por caminho (`.agents/rules/<nome>.md`), sem duplicar conteúdo.
- RF2.3 — `AGENTS.md` contém seção "Limitações conhecidas no Codex" cobrindo: ausência de slash commands de projeto, ausência de `AskUserQuestion` em `codex exec`, necessidade de MCP em `.codex/config.toml`.
- RF2.4 — `AGENTS.md` é coerente com `CLAUDE.md` (mesma descrição do projeto, mesmos paths atualizados).

### F3. Agents Codex como arquivos `.toml`

**O que faz:** os 3 agents (`kspec-task-runner`, `kspec-review-runner`, `kspec-qa-runner`) ganham equivalentes em `.codex/agents/<nome>.toml`, gerados a partir do `.agents/agents/<nome>/AGENT.md`.

**Por que importa:** o Codex CLI exige formato TOML para agents; sem isso, os agents do kspec não são acionáveis no Codex.

**Como funciona:** durante `kspec init`/`update`, a CLI lê o frontmatter e o corpo de cada `AGENT.md` e produz o `.toml` correspondente.

**Requisitos funcionais:**
- RF3.1 — Cada `.codex/agents/<nome>.toml` contém `name`, `description` (do frontmatter), `sandbox_mode` e `developer_instructions` (corpo do AGENT.md).
- RF3.2 — `sandbox_mode` mapeia: `kspec-task-runner` → `workspace-write`; `kspec-review-runner` → `read-only`; `kspec-qa-runner` → `workspace-write`.
- RF3.3 — `update` regenera os `.toml` para refletir mudanças upstream em `AGENT.md`.

### F4. CLI multiplataforma (`init`, `update`)

**O que faz:** estende `kspec init` e `kspec update` para gerar simultaneamente camadas `.claude/` e `.codex/` apontando para `.agents/`.

**Por que importa:** sem isso, projetos consumidores não conseguem ativar Codex CLI sem trabalho manual.

**Como funciona:** a CLI copia `.agents/`, cria symlinks, gera `.codex/agents/*.toml`, copia `AGENTS.md`. Em Windows, faz cópia recursiva.

**Requisitos funcionais:**
- RF4.1 — `kspec init` em projeto vazio gera `.agents/`, `.claude/` (com symlinks), `.codex/` (com symlinks e `.toml`), `AGENTS.md`, `CLAUDE.md`.
- RF4.2 — `kspec update` é idempotente: rodar duas vezes seguidas produz o mesmo resultado.
- RF4.3 — Em Windows (`process.platform === 'win32'`), a CLI cria cópias em vez de symlinks e registra aviso de que sincronização manual é responsabilidade do usuário.
- RF4.4 — Quando a CLI detecta `.claude/` como diretório real (não symlink) com conteúdo, exibe plano de migração e pede confirmação antes de prosseguir; aborta com erro claro se o usuário recusar.
- RF4.5 — `package.json#files` inclui `.agents/`, `.claude/`, `.codex/`, `AGENTS.md`, `VERSION`, `README.md`.

### F5. Bootstrap multiplataforma

**O que faz:** `kspec-bootstrap` pergunta ao usuário quais plataformas configurar e se deve registrar os MCPs do kspec.

**Por que importa:** usuários precisam controlar quais arquivos são gerados; um time Codex-only não deve receber `CLAUDE.bootstrap.md` desnecessariamente.

**Como funciona:** via `AskUserQuestion`, a skill apresenta opções e gera artefatos sob demanda.

**Requisitos funcionais:**
- RF5.1 — Bootstrap pergunta "Quais plataformas devem ser configuradas?" com opções: "Claude Code apenas", "Codex CLI apenas", "Ambas (Recomendado)".
- RF5.2 — Conforme a resposta, gera `CLAUDE.bootstrap.md`, `AGENTS.bootstrap.md`, ou ambos.
- RF5.3 — Se Codex foi selecionado, pergunta "Registrar MCP servers (context7, testsprite) em `.codex/config.toml`?" com default **Não**.
- RF5.4 — Quando o usuário aceita registrar MCPs, a skill cria `.codex/config.toml` contendo `[mcp_servers.context7]` e `[mcp_servers.testsprite]` com os comandos `npx -y` padrão.
- RF5.5 — Bootstrap em modo `codex exec` documenta a limitação e aborta com mensagem clara (o `AskUserQuestion` não funciona neste modo).

### F6. Documentação e versionamento

**O que faz:** atualiza README, CLAUDE.md, AGENTS.md, `kspec-version` e bump para 1.2.0.

**Por que importa:** consumidores precisam entender o que mudou, como usar e como diagnosticar limitações.

**Requisitos funcionais:**
- RF6.1 — README contém "Matriz de plataformas" indicando, para cada plataforma, onde vivem skills/agents/rules/templates e como invocar.
- RF6.2 — README e AGENTS.md listam as limitações conhecidas (`codex exec`, slash commands, Windows, MCP, sandbox).
- RF6.3 — `kspec-version` agrega `.agents/skills/*/SKILL.md` (fonte canônica) e imprime "Plataformas suportadas: Claude Code, OpenAI Codex CLI".
- RF6.4 — `package.json` e `VERSION` em **1.2.0**; `description` menciona Codex CLI; `keywords` inclui `codex` e `openai-codex`.

## Experiência do Usuário

**Fluxos principais:**

1. **Onboarding inicial:** `npm i -g @k77-dev/kspec@1.2.0` → `kspec init` → estrutura gerada → leitura de `AGENTS.md` e/ou `CLAUDE.md` → primeiro `/kspec-prd` ou `$kspec-prd`.
2. **Adoção em projeto existente:** `kspec-bootstrap` → escolhe plataforma → revisa `*.bootstrap.md` → renomeia para `CLAUDE.md`/`AGENTS.md`.
3. **Atualização:** `npm i -g @k77-dev/kspec@latest` → `kspec update` → symlinks e `.toml` regenerados.
4. **Inspeção:** `/kspec-version` ou `$kspec-version` lista skills, agents e plataformas suportadas.

**UI/UX e acessibilidade:**

- CLI emite mensagens em pt-BR seguindo padrão atual (`→`, `✓`, `✗`).
- Plano de migração para `.claude/` real é apresentado como lista numerada antes do prompt de confirmação.
- Mensagens de erro descrevem causa e próxima ação concreta.
- Documentação Markdown segue padrões existentes (hierarquia de headings, fenced code blocks com linguagem declarada).

## Restrições Técnicas de Alto Nível

- **Compatibilidade Claude Code:** zero regressão. O Claude Code deve continuar enxergando todas as skills/agents/rules/templates via `.claude/`.
- **Discovery do Codex:** `.agents/skills/` é varrido nativamente pelo Codex CLI; `.codex/skills/` é prioridade secundária e existe como reforço quando o usuário roda `--cwd` a partir de subdiretório.
- **Frontmatter de skill:** `name` e `description` mandatórios; `version` e `argument-hint` aceitos por Claude e ignorados por Codex (mantidos para preservar UX do Claude).
- **`codex exec` (não-interativo):** não suporta `AskUserQuestion`. 6 skills (`kspec-prd`, `kspec-techspec`, `kspec-tasks`, `kspec-implement`, `kspec-bugfix`, `kspec-bootstrap`) só funcionam em modo interativo. Limitação documentada em `AGENTS.md` e README; sem mudança de mecanismo no MVP.
- **Windows e symlinks:** fallback obrigatório para cópia (`process.platform === 'win32'`). Sincronização manual após updates fica documentada como responsabilidade do usuário.
- **MCP config:** Codex consome MCP via `.codex/config.toml` (projeto) ou `~/.codex/config.toml` (global). Não há descoberta automática; opt-in via `kspec-bootstrap`.
- **Sandbox dos agents:** `kspec-task-runner` e `kspec-qa-runner` exigem `workspace-write`; `kspec-review-runner` opera em `read-only`. Usuário precisa rodar Codex com sandbox compatível.
- **Distribuição:** publicação via npm registry em `@k77-dev/kspec`. Tarball deve incluir `.agents/`, `.claude/`, `.codex/`, `AGENTS.md`, `VERSION`, `README.md`.
- **Versão:** bump 1.1.3 → **1.2.0** (minor — novo target de plataforma, mudanças retrocompatíveis para consumidores Claude-only).

## Fora de Escopo

- **Substituição de `AskUserQuestion` por mecanismo agnóstico** — escopo grande, fica para release futura. As 6 skills afetadas permanecem com limitação documentada em `codex exec`.
- **Symlinks nativos no Windows via `mklink`** — fallback de cópia é suficiente para o MVP.
- **Auto-detecção do binário `codex` no PATH** — bootstrap sempre pergunta sobre plataformas; sem detecção automática.
- **Suporte a outros assistentes** (GitHub Copilot Workspace, Cursor, Cline) — fora do escopo desta release.
- **Reescrita de skills para usar APIs específicas do Codex** — não há APIs específicas; skills são Markdown neutro.
- **Mudança de templates** (`prd-template.md`, `techspec-template.md`, etc.) — templates são agnósticos e permanecem como estão.
- **Migração silenciosa de `.claude/` real para symlinks** — exige confirmação explícita.
- **Telemetria de adoção** por plataforma — sem instrumentação no MVP.

*(Nota: riscos de implementação técnica e estratégia de PRs sequenciais serão detalhados na Tech Spec.)*
