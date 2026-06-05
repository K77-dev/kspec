# Tarefa 2.0: Funções Cursor em `install.ts` + `paths.ts`

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 1.0 (usa `ruleToMdc` para gerar os `.mdc`)

## Estimativa

- **Tamanho**: G
- **Horas estimadas**: 4-8h

## Visão Geral

Adicionar à orquestração `runInstall` as funções inline que constroem a camada `.cursor/`: symlinks de skills, agents e diretórios (`templates`, `validation`), geração derivada das rules `.mdc` (com poda de órfãos) e a extensão do `InstallReport`. Reaproveita a mecânica existente (`linkOrCopy` idempotente + hash-based skip), seguindo o mesmo padrão de `buildClaudeLinks`/`buildCodexAgentsToml`.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — nomenclatura/SOLID dos novos helpers; reuso em vez de duplicação.
- `.agents/rules/logging.md` — mensagens pt-BR `→/✓/⚠/✗` (incl. aviso de Windows e symlink quebrado).
</skills>

<requirements>
- `buildCursorSkillsLinks(targetRoot, skills)` — symlinks `.cursor/skills/<nome>` → `.agents/skills/<nome>` para todas as skills (kspec-* + empresariais). (RF1.1)
- `buildCursorAgentsLinks(targetRoot, agents)` — symlinks `.cursor/agents/<nome>` → `.agents/agents/<nome>`. (RF1.2, decisão do usuário)
- `buildCursorDirLinks(targetRoot)` — symlinks de diretório `.cursor/templates` e `.cursor/validation` → `.agents/...` (idêntico a `CLAUDE_DIR_LINKS`, **exceto `rules`**). (RF1.1)
- `buildCursorRulesMdc(targetRoot)` — converte cada `.agents/rules/*.md` em `.cursor/rules/*.mdc` (hash-based skip) e **poda `.mdc` órfãos** (sem `.md` de origem). (RF1.3, RF1.4, R2)
- Symlink de rule empresarial quebrado → converte os que resolvem, pula os quebrados com aviso pt-BR, sem falhar o comando (decisão `skip_warn`).
- Windows: `linkOrCopy` cai para cópia + aviso (já existente). (RF1.5)
- `InstallReport` estendido com `linkedCursorSkills`, `linkedCursorAgents`, `generatedMdc`.
- `src/utils/paths.ts` — `getCursorMdSource()` (e `getCursorSourceDir()` se necessário).
- Idempotência: `update` 2× = diff zero (symlinks via `isIdempotentSymlink`, `.mdc` via hash). (RF1.4)
</requirements>

## Subtarefas

- [ ] 2.1 Estender `InstallReport` (campos Cursor) e os resolvedores em `paths.ts`.
- [ ] 2.2 Implementar `buildCursorSkillsLinks`, `buildCursorAgentsLinks` e `buildCursorDirLinks`.
- [ ] 2.3 Implementar `buildCursorRulesMdc` (conversão + hash-based skip + poda de órfãos + tratamento de symlink quebrado).
- [ ] 2.4 Integrar as funções na sequência de `runInstall` (após Claude e Codex).
- [ ] 2.5 Testes unitários de FS (preferir `tmpdir` real).

## Detalhes de Implementação

Ver `techspec.md` → "Arquitetura do Sistema → Visão Geral dos Componentes" (lista de funções inline e fluxo de dados) e "Considerações Técnicas → Decisões Principais / Riscos Conhecidos" (R2 órfãos, R4 Windows, `skip_warn`).

## Critérios de Sucesso

- Após `kspec init`, ≥11 symlinks em `.cursor/skills/` e ≥3 em `.cursor/agents/`.
- Cada `.md` resolvível em `.agents/rules/` gera um `.mdc` em `.cursor/rules/`; órfãos são removidos.
- `code-standards.mdc` contém `alwaysApply: true`.
- `update` executado 2× não produz diferença (idempotência).
- `runInstall` não falha por symlink empresarial quebrado (apenas aviso).

## Testes da Tarefa

- [ ] Testes de unidade:
  - `detectMigration`/symlinks via `tmpdir`: criação correta de `.cursor/skills`, `.cursor/agents`, `.cursor/templates`, `.cursor/validation`.
  - Conversor com symlink quebrado → retorna aviso, não lança.
  - Poda de `.mdc` órfão.
  - Idempotência de symlinks + `.mdc`.
- [ ] Testes de integração (coberto na 6.0)
- [ ] Testes E2E (N/A)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `src/lib/install.ts` — funções Cursor + integração em `runInstall` + `InstallReport`.
- `src/lib/platform.ts` — `linkOrCopy`/`isOnWindows` (reuso).
- `src/utils/paths.ts` — resolvedores de fonte Cursor.
- `src/lib/install.test.ts` — testes de FS.
