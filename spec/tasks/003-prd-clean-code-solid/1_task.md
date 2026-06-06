# Tarefa 1.0: Expandir rule universal `code-standards.md`

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Requisitos Atendidos

- REQ-001 — Rule universal `code-standards.md`

## Dependências

- Nenhuma

## Estimativa

- **Tamanho**: G
- **Horas estimadas**: 4-8h

## Visão Geral

Substituir o placeholder atual de `code-standards.md` (apenas o título) por uma rule universal completa com princípios Clean Code, SOLID, limites mensuráveis, classificação de severidade e exemplos ✅/❌ em TypeScript e Java. Este artefato é a fundação — todos os agents, skills e templates das tarefas seguintes referenciam este conteúdo.

<skills>
### Conformidade com Skills Padrões

- Meta: a própria rule deve seguir os limites que define (funções concisas, SRP, nomenclatura expressiva).
- Enterprise rules (`react.md`, `spring-boot.md`, etc.) permanecem fora de escopo — `code-standards.md` é independente de stack.
</skills>

<requirements>
- Implementar as 18 seções documentadas na techspec (§ Design de Implementação → Interfaces Principais). (RF-001.1 a RF-001.6)
- Documentar princípios Clean Code: nomenclatura, funções pequenas, early returns, DRY, comentários, erros, magic numbers e parâmetros. (RF-001.1)
- Documentar os cinco princípios SOLID com definição, sinais de violação e orientações de correção. (RF-001.2)
- Incluir tabela de limites mensuráveis com valores: 50 linhas, complexidade 10, 4 parâmetros, 3 níveis de aninhamento, God Class (300 linhas / 15 métodos públicos), duplicação 6 linhas. (RF-001.3)
- God Class classificada como **aviso**, não bloqueante (decisão confirmada na techspec).
- Limites aplicam-se a **todas as linguagens**; exemplos ilustrativos apenas em TypeScript e Java. (RF-001.4)
- Classificar violações em bloqueante, aviso e sugestão com exemplos concretos. (RF-001.5)
- Manter a rule technology-agnostic; convenções de framework ficam nas rules enterprise. (RF-001.6)
- Conteúdo com no máximo 2.000 palavras.
- Frontmatter opcional recomendado: `description: Clean Code, SOLID e limites mensuráveis — rule universal sempre aplicável`.
- Editar apenas `.agents/rules/code-standards.md` (source of truth).
</requirements>

## Subtarefas

- [x] 1.1 Redigir seções 1–8 (Clean Code: propósito, nomenclatura, funções, early returns, DRY, comentários, erros, magic numbers/parâmetros).
- [x] 1.2 Redigir seções 9–13 (SOLID: SRP, OCP, LSP, ISP, DIP — cada um com definição, sinais e correção).
- [x] 1.3 Criar §14 Limites Mensuráveis (tabela com métricas, limites, severidade e como verificar).
- [x] 1.4 Criar §15 Classificação de Violações (bloqueante | aviso | sugestão) com exemplos.
- [x] 1.5 Criar §16 Exemplos TypeScript e §17 Exemplos Java (✅/❌ em SRP, DIP, nomenclatura e funções longas).
- [x] 1.6 Adicionar §18 Relação com Rules de Stack e frontmatter opcional.
- [x] 1.7 Validar contagem de palavras ≤ 2.000 e ≥ 15 seções numeradas.

## Detalhes de Implementação

Ver `techspec.md` → "Design de Implementação" (estrutura obrigatória das 18 seções, tabela de limites §14, classificação §15). Arquivo alvo: `.agents/rules/code-standards.md`.

## Critérios de Sucesso

- `code-standards.md` contém ≥ 15 seções numeradas cobrindo RF-001.1 a RF-001.6.
- Tabela de limites presente com valores 50, 10, 4, 3, 300, 15 e 6.
- Exemplos ✅/❌ existem para TypeScript e Java em SRP, DIP, nomenclatura e funções longas.
- Classificação bloqueante/aviso/sugestão documentada com God Class como aviso.
- Documento ≤ 2.000 palavras.

## Testes da Tarefa

- [x] Testes de unidade: criar `tests/clean-code-solid-coherence.spec.ts` com bloco `describe("code-standards.md")` validando seções, tabela de limites, classificação, exemplos TS/Java e contagem de palavras.
- [x] Testes de integração: executar `npm test -- clean-code-solid-coherence` e confirmar que o bloco da rule passa.
- [ ] Testes E2E: N/A nesta tarefa.

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/rules/code-standards.md` — source of truth da rule (substituir placeholder atual).
- `tests/clean-code-solid-coherence.spec.ts` — criar com asserções iniciais da rule (expandido na tarefa 5.0).
- `.cursor/rules/code-standards.mdc` — artefato derivado (gerado por `ruleToMdc` no install/update; não editar diretamente).
