# Relatório de Code Review — Task 6.0: Implementar `src/lib/agent-toml.ts`

## Resumo

- Data: 2026-05-12
- Branch: 001-prd-codex-cli-support
- Status: **APROVADO**
- Arquivos implementados: 2 (`src/lib/agent-toml.ts`, `tests/agent-toml.spec.ts`)
- Linhas adicionadas: 98 (implementação) + 255 (testes)
- Linhas removidas: 0

---

## Conformidade com Rules

| Rule | Status | Observações |
|------|--------|-------------|
| Idioma em inglês (código) | OK | Todas as declarações, variáveis, funções e comentários em inglês |
| camelCase para funções/variáveis | OK | `parseAgentFile`, `renderAgentToml`, `resolveSandboxMode`, `escapeTomlString`, `parseFrontmatterBlock`, `warnCallback` |
| PascalCase para interfaces/tipos | OK | `AgentFrontmatter`, `AgentDocument`, `SandboxMode` |
| kebab-case para arquivos | OK | `agent-toml.ts`, `agent-toml.spec.ts` |
| Nomenclatura clara (sem abreviações) | OK | Nomes descritivos e sem abreviações excessivas |
| SCREAMING_SNAKE_CASE para constantes | OK | `SANDBOX_BY_AGENT`, `DEFAULT_SANDBOX_MODE`, `FRONTMATTER_REGEX` |
| Funções iniciam com verbo | OK | `parse...`, `render...`, `resolve...`, `escape...` |
| Parâmetros <= 3 (usar interface) | OK | `parseFrontmatterBlock(block, filePath)` — 2 params; `renderAgentToml(doc, sandboxMode)` — 2 params |
| Sem magic numbers | OK | Todas as constantes nomeadas |
| Early returns (sem if aninhado > 2) | OK | `resolveSandboxMode` usa early return; `parseFrontmatterBlock` usa early return pós-loop |
| Sem flag params | OK | Sem booleans para chavear comportamento |
| Funções <= 50 linhas | OK | Maior função: `parseFrontmatterBlock` com ~21 linhas; `renderAgentToml` com ~17 linhas |
| Sem linhas em branco dentro de funções | OK | Linhas em branco presentes apenas entre declarações de nível de módulo (entre funções), não dentro delas |
| Sem comentários desnecessários | OK | Código autoexplicativo; sem comentários redundantes |
| Uma variável por linha | OK | Sem declarações múltiplas em uma linha |

---

## Aderência à TechSpec

| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `SandboxMode = "workspace-write" \| "read-only"` | SIM | Exportado como `export type` |
| Interface `AgentFrontmatter` com `name` e `description` | SIM | Campos obrigatórios conforme especificado |
| Interface `AgentDocument` com `frontmatter` e `body` | SIM | Estrutura exata da TechSpec |
| `SANDBOX_BY_AGENT` hardcoded com 3 agents | SIM | `task-runner → workspace-write`, `review-runner → read-only`, `qa-runner → workspace-write` |
| Default `workspace-write` para agents fora do mapa | SIM | Via `DEFAULT_SANDBOX_MODE` constante |
| Warning via stderr para agent fora do mapa | SIM | `process.stderr.write(message + "\n")` |
| Callback opcional para warning | SIM | `warnCallback?: (message: string) => void` — elegante, testável |
| Parser: regex `^---\n([\s\S]*?)\n---\n` | SIM | Implementado como `FRONTMATTER_REGEX` |
| Parser: aceita apenas `name:` e `description:` | SIM | Loop linha a linha, ignora demais campos (`version`, etc.) |
| Erros descritivos citando arquivo | SIM | Todas as mensagens de erro incluem `filePath` |
| Escape de `description`: `\` → `\\`, `"` → `\"` | SIM | `escapeTomlString()` implementado corretamente |
| Sem quebras de linha em `description` | PARCIAL | Escape não rejeita `\n` no valor; o parser de linha (`^description:\s*(.+)$`) naturalmente não captura multi-linhas, então proteção existe implicitamente via regex |
| Guard para `"""` no corpo | SIM | `body.includes('"""')` lança erro controlado com nome do agent |
| `developer_instructions` como `"""..."""` | SIM | Template literal com join correto |
| Sem dependências runtime externas | SIM | Usa apenas `node:fs` nativo |
| `parseAgentFile` faz apenas parse (sem I/O lateral) | SIM | Lê arquivo e retorna documento — sem efeitos colaterais |

---

## Tasks Verificadas

| Task | Status | Observações |
|------|--------|-------------|
| 6.1 — Criar `src/lib/agent-toml.ts` com tipos e constantes | COMPLETA | `SandboxMode`, `AgentFrontmatter`, `AgentDocument`, `SANDBOX_BY_AGENT` presentes |
| 6.2 — Implementar `parseAgentFile()` | COMPLETA | Regex de frontmatter + parsing linha-a-linha |
| 6.3 — Implementar `renderAgentToml()` com escape e guard `"""` | COMPLETA | Escape correto, guard implementado |
| 6.4 — Testes unitários em `tests/agent-toml.spec.ts` | COMPLETA | 23 cenários cobrindo todos os casos exigidos |

---

## Testes

- Total de testes no arquivo: 23
- Testes passando: 23
- Testes falhando: 0
- Total de testes na suite completa: 44 (4 arquivos)
- Coverage: N/A (Vitest não configurado com coverage nesta task)

### Cobertura por Categoria (agent-toml.spec.ts)

| Grupo | Cenários | Cobertura |
|-------|----------|-----------|
| `parseAgentFile` — caminho feliz | 2 | Frontmatter mínimo, corpo multi-linha |
| `parseAgentFile` — erros | 5 | Sem delimitador, sem `name`, sem `description`, mensagem inclui path (2x) |
| `renderAgentToml` — caminho feliz | 4 | Chaves obrigatórias, multi-line string, sandbox `read-only`, sandbox `workspace-write` |
| `renderAgentToml` — escape | 3 | Backslash, aspas duplas, combinação |
| `renderAgentToml` — guard `"""` | 2 | Erro controlado, mensagem inclui nome do agent |
| `resolveSandboxMode` — mapa | 3 | Os 3 agents conhecidos |
| `resolveSandboxMode` — default + warning | 3 | Default retornado, callback acionado, stderr acionado |
| Integração round-trip | 2 | Parse + render completo; campo `version` ignorado |

---

## Verificacao de Segurança

| Item | Status | Observações |
|------|--------|-------------|
| Inputs validados | OK | Frontmatter validado via regex + early return com erro descritivo |
| Sem secrets hardcoded | OK | Nenhuma credencial ou token no código |
| Sanitização de TOML | OK | `description` escapada; guard contra `"""` no corpo |
| Sem execução de código arbitrário | OK | Parser aceita apenas `name:` e `description:`; YAML complexo é rejeitado |
| Erros não vazam stack trace interno | OK | Mensagens de erro são descritivas mas não expõem internals inesperados |
| Dados sensíveis em logs | N/A | Sem dados sensíveis; paths de FS são esperados |
| Endpoints, autenticação, CORS, SQL | N/A | Módulo de CLI puro, sem rede ou banco |

---

## Problemas Encontrados

| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa | `tests/agent-toml.spec.ts` | 142-150 | Teste `escapes both backslash and double quotes combined` declara `rendered` mas não verifica o escape combinado de forma assertiva — apenas `expect(rendered).toContain("description =")`, que sempre seria verdadeiro | Substituir por assert específico, ex: `expect(rendered).toContain('"Path: \\\\\\\\"quoted\\\\\\\\""')` ou verificar o valor real escapado |
| Baixa | `src/lib/agent-toml.ts` | 52 | Linha muito longa (>120 chars) na mensagem de erro de `parseAgentFile` | Quebrar a string em template literal de múltiplas linhas para melhor legibilidade |

---

## Pontos Positivos

- Separação de responsabilidades exemplar: `parseFrontmatterBlock` (privado), `parseAgentFile` (público), `escapeTomlString` (privado), `resolveSandboxMode` (público), `renderAgentToml` (público) — cada função faz exatamente uma coisa.
- `resolveSandboxMode` expõe `warnCallback` opcional como alternativa ao stderr — decisão excelente para testabilidade.
- A constante `DEFAULT_SANDBOX_MODE` evita magic string e centraliza o default, facilitando mudanças futuras.
- Testes usam `os.tmpdir()` real conforme orientado pela TechSpec — sem mocks de FS desnecessários.
- `afterEach` com `rmSync` garante limpeza de arquivos temporários.
- Integração com os 3 AGENT.md reais validada manualmente durante o review: `kspec-task-runner`, `kspec-review-runner` e `kspec-qa-runner` geram TOML válido com sandbox correto.
- Nenhuma dependência runtime nova introduzida.
- `version` e demais campos do frontmatter são silenciosamente ignorados, conforme especificado para compatibilidade com Claude Code.

---

## Recomendacoes

1. **Teste combinado fraco (Baixa)**: substituir o assert genérico `toContain("description =")` no cenário `escapes both backslash and double quotes combined` por verificação do valor escapado exato.
2. **Linha longa (Baixa)**: quebrar a mensagem de erro na linha 52 de `parseAgentFile` para facilitar leitura durante manutenção.
3. **Coverage explícita (Opcional)**: adicionar `@vitest/coverage-v8` como devDep e configurar threshold mínimo de 80% para a task futura que adicionar coverage ao pipeline.

---

## Conclusao

A implementação da Task 6.0 atende integralmente aos requisitos funcionais da TechSpec e aos critérios de aceitação da task. Todos os 23 testes unitários passam, cobrindo caminhos felizes, casos de erro, edge cases de escape e cenários de integração. O código segue os padrões de `code-standards.md` sem desvios significativos. Os dois problemas identificados são de baixa severidade e não bloqueiam o uso do módulo. A integração ad-hoc com os 3 AGENT.md reais confirmou que o parser e o gerador de TOML funcionam corretamente em condições reais.

**Status: APROVADO**
