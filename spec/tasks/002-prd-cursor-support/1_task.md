# Tarefa 1.0: Conversor `.md → .mdc` (`ruleToMdc`) + testes unitários

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- Nenhuma

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Implementar o núcleo isolado da feature: a função `ruleToMdc(name, raw)` que converte uma rule no formato Claude (`.agents/rules/*.md`) para o formato Cursor (`.cursor/rules/*.mdc`), reescrevendo apenas o frontmatter e preservando o corpo Markdown byte a byte. Esta task não toca em efeitos colaterais de filesystem — apenas a transformação pura de texto — o que a torna o ponto de partida testável de forma isolada.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — nomenclatura, SOLID e clareza nos novos helpers TypeScript.
- `.agents/rules/logging.md` — não aplicável diretamente (sem I/O nesta task), mas mensagens auxiliares devem seguir o padrão pt-BR `→/✓/⚠/✗` quando expostas.
</skills>

<requirements>
- Implementar `ruleToMdc(name: string, raw: string): string` conforme contrato da Tech Spec (interfaces `RuleFrontmatter` / `McdcFrontmatter`).
- Heurística de frontmatter (REQ-001 / RF1.3):
  - rule com `paths` → `globs = paths.join(",")`, `alwaysApply: false`.
  - rule sem `paths` → `alwaysApply: false` (Agent Requested via `description`).
  - exceção única `name === "code-standards"` → `alwaysApply: true`.
- Extração de `description` (decisão `h1_body`): frontmatter `description` → senão primeiro `# H1` do corpo → senão primeira linha não vazia → fallback nome legível do arquivo.
- Corpo Markdown preservado byte a byte (somente o frontmatter é reescrito).
- Conversão idempotente: mesma entrada → mesma saída (e mesmo hash).
- Sem dependência externa nova — usar apenas utilidades já presentes (`node:crypto` para hash quando aplicável).
</requirements>

## Subtarefas

- [ ] 1.1 Definir as interfaces `RuleFrontmatter` e `McdcFrontmatter` e o parser de frontmatter de entrada (`--- ... ---`).
- [ ] 1.2 Implementar a heurística de `globs`/`alwaysApply` e a extração de `description` (`h1_body`).
- [ ] 1.3 Renderizar o `.mdc` final (frontmatter reescrito + corpo preservado).
- [ ] 1.4 Escrever testes unitários (Vitest) cobrindo os casos da Tech Spec.

## Detalhes de Implementação

Ver `techspec.md` → seções "Design de Implementação → Interfaces Principais" (contrato `ruleToMdc`) e "Modelos de Dados" (entrada `.md` / saída `.mdc`). A função pode ser implementada inline em `src/lib/install.ts` (decisão `in_install`), mas mantida pura para testabilidade.

## Critérios de Sucesso

- `ruleToMdc` cobre as três variações da heurística e a cadeia de extração de `description`.
- Corpo da rule não sofre alterações (diff de corpo = zero).
- Saída idempotente (mesma entrada produz hash idêntico).
- Lint e build passam sem erros.

## Testes da Tarefa

- [ ] Testes de unidade:
  - (a) rule com `paths` → `globs` CSV correto e `alwaysApply: false`.
  - (b) `code-standards` → `alwaysApply: true`.
  - (c) rule sem `paths` e sem `description` → `description` extraída do `# H1`.
  - (d) corpo preservado byte a byte.
  - (e) idempotência (mesma entrada → mesmo hash).
- [ ] Testes de integração (não nesta task — coberto na 6.0)
- [ ] Testes E2E (N/A)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `src/lib/install.ts` — função `ruleToMdc` (inline).
- `src/lib/install.test.ts` (ou equivalente Vitest) — testes unitários do conversor.
