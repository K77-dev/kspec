# Tarefa 2.0: Enforcement no `kspec-review-runner`

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Requisitos Atendidos

- REQ-002 — Enforcement no `kspec-review-runner`

## Dependências

- 1.0

## Estimativa

- **Tamanho**: G
- **Horas estimadas**: 4-8h

## Visão Geral

Expandir o agent `kspec-review-runner` para aplicar sistematicamente os critérios de `code-standards.md` durante o review. Inclui checklist derivado da rule, critérios de reprovação bloqueante separados de avisos, citação de seções da rule no relatório e nova seção "Conformidade Clean Code/SOLID" com tabela item × status.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — rule obrigatória na etapa de conformidade (depende da tarefa 1.0).
- Manter compatibilidade com verificações existentes (segurança, TechSpec, testes).
</skills>

<requirements>
- Referenciar `code-standards.md` como rule obrigatória na etapa de conformidade. (RF-002.1)
- Expandir etapa "Análise de Qualidade de Código" com checklist item a item verificável derivado da rule. (RF-002.1)
- Definir critérios bloqueantes explícitos: função > 50 linhas, complexidade > 10, SRP violado em código novo, DIP com dependência concreta injetável, duplicação > 6 linhas. (RF-002.2)
- Separar critérios bloqueantes de avisos (God Class, parâmetros > 4, aninhamento > 3). (RF-002.2)
- Checklist deve cobrir os cinco princípios SOLID com critério verificável. (RF-002.2)
- Relatório deve citar seções da rule (ex.: `code-standards.md § SRP`, `§ Limites Mensuráveis`). (RF-002.3)
- Formato `review_[num].md` inclui seção "Conformidade Clean Code/SOLID" com tabela item × status. (RF-002.3)
- Manter compatibilidade com verificações existentes (segurança, aderência à TechSpec, testes). (RF-002.4)
- Editar apenas `.agents/agents/kspec-review-runner/AGENT.md`.
</requirements>

## Subtarefas

- [x] 2.1 Adicionar leitura obrigatória de `code-standards.md` na etapa de análise de documentação.
- [x] 2.2 Expandir Step 8 ("Análise de Qualidade de Código") com checklist compacto dos 5 princípios SOLID + Clean Code.
- [x] 2.3 Documentar critérios bloqueantes em bloco `<critical>` separado dos avisos.
- [x] 2.4 Definir template da seção "Conformidade Clean Code/SOLID" no relatório (tabela item × status × severidade × referência §).
- [x] 2.5 Instruir citação de seções da rule em cada violação encontrada.

## Detalhes de Implementação

Ver `techspec.md` → "Design de Implementação" (classificação §15, tabela de limites §14) e `prd.md` → REQ-002. Arquivo alvo: `.agents/agents/kspec-review-runner/AGENT.md`. Propagação automática para `.claude/agents/` (symlink) e `.codex/agents/kspec-review-runner.toml` (pipeline `agent-toml`).

## Critérios de Sucesso

- AGENT.md referencia `code-standards.md` como rule obrigatória.
- Checklist inclui todos os cinco princípios SOLID com critério verificável.
- Critérios bloqueantes explícitos e separados de avisos.
- Formato do relatório documenta seção "Conformidade Clean Code/SOLID" com tabela.
- Instruções de citação `code-standards.md § *` presentes.

## Testes da Tarefa

- [x] Testes de unidade: adicionar bloco `describe("kspec-review-runner")` em `tests/clean-code-solid-coherence.spec.ts` com asserções de referência à rule, checklist SOLID, bloqueantes vs avisos e formato de relatório.
- [x] Testes de integração: executar `npm test -- clean-code-solid-coherence` e confirmar que o bloco do review-runner passa.
- [ ] Testes E2E: N/A nesta tarefa (validação manual recomendada na tarefa 5.0).

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/agents/kspec-review-runner/AGENT.md` — source of truth do agent.
- `.agents/rules/code-standards.md` — rule referenciada (tarefa 1.0).
- `tests/clean-code-solid-coherence.spec.ts` — asserções do review-runner.
- `.codex/agents/kspec-review-runner.toml` — artefato derivado (não editar diretamente).
