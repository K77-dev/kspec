# PRD — Clean Code e SOLID em Projetos-Alvo do kspec

## Visão Geral

O kspec orienta agentes de IA a implementar e revisar código em projetos-alvo, mas hoje carece de critérios concretos e aplicáveis de qualidade. A rule universal `code-standards.md` está praticamente vazia (apenas o título), enquanto a documentação e o `kspec-review-runner` mencionam SOLID sem detalhar verificações objetivas. O resultado é código inconsistente entre entregas e entre projetos: agentes improvisam padrões ou ignoram princípios fundamentais de Clean Code.

Esta funcionalidade estabelece um **padrão universal de qualidade** — Clean Code e princípios SOLID — distribuído pelo core do kspec e **aplicado de ponta a ponta** nos agents e no bootstrap. Desenvolvedores que usam Claude Code, Codex CLI ou Cursor em projetos-alvo passam a receber implementações e reviews alinhados a critérios mensuráveis, com exemplos por linguagem e regras explícitas de aprovação/reprovação no review.

**Público-alvo:** desenvolvedores que utilizam agentes de IA no dia a dia do projeto-alvo.

## Objetivos

| Objetivo | Métrica de sucesso |
|----------|-------------------|
| Rule universal acionável | `code-standards.md` com ≥ 15 seções cobrindo Clean Code, SOLID, métricas e exemplos ✅/❌ para TypeScript e Java |
| Enforcement na implementação | `kspec-task-runner` e skill `kspec-implement` referenciam e verificam critérios da rule antes de marcar task como completa |
| Enforcement no review | `kspec-review-runner` possui checklist detalhado com critérios de reprovação explícitos para violações graves de Clean Code/SOLID |
| Distribuição no bootstrap | `kspec-bootstrap` garante que `code-standards.md` esteja presente, referenciado nos guias gerados e com `alwaysApply: true` no Cursor |
| Consistência entre plataformas | Paridade em `.agents/`, `.claude/`, `.codex/` e `.cursor/` após `kspec install` / `kspec update` |

## Histórias de Usuário

- Como **desenvolvedor** que implementa features via `kspec-implement`, quero que o agente siga princípios Clean Code e SOLID durante a codificação, para que eu não precise corrigir manualmente violações básicas de qualidade.
- Como **desenvolvedor** que recebe o review do `kspec-review-runner`, quero um relatório com critérios objetivos (nomenclatura, tamanho de função, SRP, DIP etc.), para entender exatamente o que foi reprovado e por quê.
- Como **desenvolvedor** que configura um projeto novo com `kspec-bootstrap`, quero que os padrões de qualidade estejam instalados e visíveis nos guias do projeto desde o primeiro dia, para que todos os agentes compartilhem a mesma base de regras.
- Como **desenvolvedor** em projeto brownfield, quero que princípios universais (SOLID, DRY, tratamento de erros) sejam preservados mesmo quando convenções de estilo do projeto prevalecem, para não sacrificar qualidade estrutural por compatibilidade com legado.

## Funcionalidades Principais

### REQ-001 — Rule universal `code-standards.md`

Expandir a rule core com conteúdo completo, technology-agnostic, servindo como fonte de verdade para todos os agents.

**Requisitos funcionais:**

1. **RF-001.1** — Documentar princípios Clean Code: nomenclatura expressiva, funções pequenas e com responsabilidade única, early returns, DRY, evitar comentários óbvios, tratamento explícito de erros, evitar magic numbers e parâmetros excessivos.
2. **RF-001.2** — Documentar os cinco princípios SOLID com definição, sinais de violação e orientações de correção (SRP, OCP, LSP, ISP, DIP).
3. **RF-001.3** — Definir **limites mensuráveis** para revisão manual pelos agents (sem ferramentas de lint):
   - Função: máximo 50 linhas úteis (excluindo comentários e linhas em branco)
   - Complexidade ciclomática estimada: máximo 10 por função (contagem de pontos de decisão + 1)
   - Parâmetros: máximo 4 por função/método
   - Profundidade de aninhamento: máximo 3 níveis
   - Classe/arquivo: sinalizar "God Class" acima de 300 linhas ou mais de 15 métodos públicos
4. **RF-001.4** — Incluir exemplos ✅/❌ para **TypeScript** e **Java** (as duas linguagens mais comuns no ecossistema kspec enterprise).
5. **RF-001.5** — Classificar violações em três níveis: **bloqueante** (reprova review), **aviso** (aprova com ressalvas) e **sugestão** (melhoria opcional).
6. **RF-001.6** — Manter a rule independente de stack; convenções específicas de framework permanecem nas rules enterprise (`react.md`, `spring-boot.md`, etc.).

#### Critérios de Aceite

- `code-standards.md` contém seções numeradas cobrindo RF-001.1 a RF-001.6
- Exemplos ✅/❌ existem para TypeScript e Java em pelo menos SRP, DIP, nomenclatura e funções longas
- Tabela de limites mensuráveis está presente e referenciada pelos agents
- Documento permanece com no máximo 2.000 palavras

---

### REQ-002 — Enforcement no `kspec-review-runner`

Atualizar o agent de review para aplicar os critérios da rule de forma sistemática e reproduzível.

**Requisitos funcionais:**

1. **RF-002.1** — Expandir a etapa "Análise de Qualidade de Código" com checklist derivado de `code-standards.md`, item a item verificável.
2. **RF-002.2** — Definir **critérios de reprovação bloqueante**: função > 50 linhas, complexidade estimada > 10, violação clara de SRP (classe/função com múltiplas responsabilidades não justificadas), dependência de implementação concreta onde abstração é esperada (DIP), código duplicado (> 6 linhas idênticas em mais de um local).
3. **RF-002.3** — Relatório de review deve citar a seção da rule violada (ex.: `code-standards.md § SRP`, `§ Limites Mensuráveis`).
4. **RF-002.4** — Manter compatibilidade com verificações existentes (segurança, aderência à TechSpec, testes).

#### Critérios de Aceite

- AGENT.md do `kspec-review-runner` referencia `code-standards.md` como rule obrigatória na etapa de conformidade
- Checklist inclui todos os cinco princípios SOLID com critério verificável
- Critérios bloqueantes estão explícitos e separados de avisos
- Formato do relatório `review_[num].md` inclui seção "Conformidade Clean Code/SOLID" com tabela item × status

---

### REQ-003 — Enforcement no `kspec-task-runner` e `kspec-implement`

Garantir que a qualidade seja aplicada **durante** a implementação, não apenas no review posterior.

**Requisitos funcionais:**

1. **RF-003.1** — `kspec-task-runner` deve ler `code-standards.md` na etapa de análise da tarefa e incluir no resumo pré-implementação os princípios relevantes ao escopo.
2. **RF-003.2** — Antes de marcar a task como completa, o task-runner deve auto-verificar: nomenclatura, ausência de funções longas, SRP em novos módulos, tratamento de erros e ausência de duplicação óbvia.
3. **RF-003.3** — Skill `kspec-implement` deve instruir que nenhuma task é considerada concluída sem passar pela auto-verificação de Clean Code/SOLID do task-runner.
4. **RF-003.4** — Em violações detectadas na auto-verificação, o agent deve corrigir antes de entregar — não delegar ao review.

#### Critérios de Aceite

- AGENT.md do `kspec-task-runner` inclui etapa explícita "Verificação Clean Code/SOLID" antes da conclusão
- SKILL.md do `kspec-implement` menciona a verificação como gate obrigatório
- Instruções referenciam limites mensuráveis da rule (50 linhas, complexidade 10, 4 parâmetros)

---

### REQ-004 — Integração no `kspec-bootstrap`

Garantir que projetos-alvo recebam e reconheçam os padrões desde a instalação.

**Requisitos funcionais:**

1. **RF-004.1** — Bootstrap deve confirmar presença de `code-standards.md` em `.agents/rules/` e listá-la como rule core obrigatória nos guias gerados (`CLAUDE.bootstrap.md`, `AGENTS.bootstrap.md`, `CURSOR.bootstrap.md`).
2. **RF-004.2** — Documentar nos guias que `code-standards.md` é **sempre aplicável** (`alwaysApply: true` no Cursor) e não deve ser removida em projetos brownfield.
3. **RF-004.3** — Em adaptação brownfield (passo 5.6 do bootstrap), princípios universais de Clean Code/SOLID **não podem ser alterados** — apenas convenções de estilo e ferramentas são adaptáveis.
4. **RF-004.4** — Relatório final do bootstrap deve incluir linha confirmando instalação/validação de `code-standards.md`.

#### Critérios de Aceite

- SKILL.md do `kspec-bootstrap` reforça RF-004.1 a RF-004.4
- Templates de guias (`claude-md-template.md`, equivalentes) listam `code-standards.md` com descrição "Clean Code, SOLID, limites mensuráveis"
- Seção brownfield explicita que SOLID/Clean Code são inegociáveis

---

### REQ-005 — Paridade entre plataformas e distribuição via CLI

As mudanças devem chegar aos projetos-alvo via `kspec install` e `kspec update`.

**Requisitos funcionais:**

1. **RF-005.1** — Alterações em `.agents/rules/code-standards.md` propagam para `.claude/rules/`, `.codex/` (referência) e `.cursor/rules/code-standards.mdc` via pipeline existente de `ruleToMdc`.
2. **RF-005.2** — `code-standards.mdc` mantém `alwaysApply: true` no Cursor.
3. **RF-005.3** — Agents atualizados em `.agents/agents/` propagam via symlinks para `.claude/agents/` e artefatos Codex (`.codex/agents/*.toml`).

#### Critérios de Aceite

- Após `kspec update` em projeto limpo, `code-standards.md` contém o novo conteúdo completo
- `.cursor/rules/code-standards.mdc` gerado com `alwaysApply: true`
- Agents review e task-runner refletem as novas instruções em todas as plataformas

## Experiência do Usuário

**Persona principal:** desenvolvedor que invoca `/kspec-implement` ou agents equivalentes e revisa entregas via `kspec-review-runner`.

**Fluxo principal:**

1. Dev executa `kspec-bootstrap` → guias listam `code-standards.md` como rule universal
2. Dev invoca implementação de task → task-runner aplica Clean Code/SOLID durante codificação
3. Review-runner valida com checklist detalhado → relatório cita seções da rule e classifica violações
4. Dev recebe código com qualidade previsível e feedback acionável

**Acessibilidade e clareza:**

- Critérios em linguagem direta, sem jargão excessivo
- Exemplos ✅/❌ facilitam compreensão por devs de diferentes níveis
- Classificação bloqueante/aviso/sugestão evita ambiguidade na decisão de aprovação

## Restrições Técnicas de Alto Nível

- Alterações devem ser feitas em `.agents/` como source of truth; symlinks e artefatos derivados seguem o pipeline existente
- A verificação de métricas (complexidade, linhas) é **estimativa manual pelo agent** — não há integração com ferramentas externas neste escopo
- A rule deve permanecer technology-agnostic; exemplos por linguagem são ilustrativos, não substituem rules de stack
- Compatibilidade com os três runtimes: Claude Code, Codex CLI e Cursor
- Conteúdo da rule limitado a 2.000 palavras para não consumir contexto excessivo dos agents

## Fora de Escopo

- **Integração com ESLint, Prettier, SonarQube ou pipelines de CI** — validação permanece manual pelos agents
- **Alteração de rules específicas de stack** (`react.md`, `spring-boot.md`, `typescript.md` enterprise etc.) — apenas `code-standards.md` e agents/skills afetados
- **Refatoração automática de código legado** existente nos projetos-alvo
- **Criação de nova skill ou agent dedicado** — enforcement ocorre nos artefatos existentes
- **Score numérico automatizado de conformidade** — o review classifica por checklist, não por algoritmo

## Premissas e Dependências

- O pipeline `ruleToMdc` em `src/lib/install.ts` já trata `code-standards` com `alwaysApply: true`
- Reviews anteriores (ex.: task 9.0 do PRD 001) já aplicaram critérios informais que serão formalizados nesta rule
- O bootstrap já copia `code-standards.md` como rule core — esta funcionalidade enriquece o conteúdo e reforça o enforcement
- Dependência de publicação: nova versão do pacote `@k77-dev/kspec` para distribuição aos projetos-alvo
