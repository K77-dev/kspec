# Relatório de Code Review — Task 7.0: Implementar `src/lib/migration.ts`

## Resumo

- Data: 2026-05-12
- Branch: 001-prd-codex-cli-support
- Status: APROVADO
- Arquivos Modificados: 2 (ambos novos, não commitados ainda)
- Linhas Adicionadas: 95 (migration.ts) + 158 (migration.spec.ts) = 253
- Linhas Removidas: 0

## Validacao de Skills Empresariais

Cache `.claude/.enterprise-skills-cache/` atualizado com sucesso (`git pull --ff-only`). Hashes locais e remotos em paridade — nenhuma skill/rule/template pendente de instalacao ou atualizacao.

`✓ Artefatos empresariais validados`

## Conformidade com Rules

| Rule | Status | Observacoes |
|------|--------|-------------|
| Idioma (ingles no codigo) | OK | Variaveis, funcoes e comentarios em ingles. Mensagens de console em pt-BR conforme padrao do projeto |
| Nomenclatura camelCase (variaveis/funcoes) | OK | `realDirs`, `filesPreserved`, `entryPath`, `classifyEntry`, `buildActions`, `collectPreservedFiles`, `detectMigration`, `confirmMigration` |
| Nomenclatura PascalCase (interfaces) | OK | `MigrationPlan` |
| Nomenclatura kebab-case (arquivos) | OK | `migration.ts`, `migration.spec.ts` |
| Funcoes comecam com verbo | OK | Todas as funcoes comecam com verbo: `classify`, `build`, `collect`, `detect`, `confirm` |
| Parametros <= 3 por funcao | OK | Nenhuma funcao possui mais de 1 parametro |
| Early returns | OK | `classifyEntry` usa early returns para `symlink` e `real-dir` antes de `absent`; `detectMigration` retorna `null` cedo quando `realDirs.length === 0` |
| Sem aninhamento > 2 niveis | OK | Maximo de 1 nivel de aninhamento em loops |
| Sem flag params | OK | Nenhum parametro booleano de comportamento |
| Sem magic numbers | OK | Nenhum numero literal sem significado |
| Funcoes <= 50 linhas | OK | Maior funcao (`confirmMigration`) tem 29 linhas |
| Sem linhas em branco dentro de funcoes | OK | Nenhuma linha em branco dentro do corpo de funcoes |
| Uma variavel por linha | OK | Nenhuma declaracao multipla de variaveis |
| Sem comentarios desnecessarios | OK | Codigo autoexplicativo, sem comentarios de "traducao" |
| Variaveis declaradas proximas ao uso | OK | `rl` declarado imediatamente antes do `try`; `classification` declarado no loop onde e usada |

Observacao menor: `rl` (2 caracteres) e `sub` (3 caracteres) sao abreviacoes curtas, mas ambas sao idiomaticas no contexto (`readline interface` e `subdirectory` em loop), nao configurando violacao da rule.

## Verificacao de Seguranca

Esta task implementa uma CLI local sem backend, endpoints ou dados de usuario. Checklist aplicado ao escopo real:

| Item | Status | Observacoes |
|------|--------|-------------|
| Sem secrets hardcoded | OK | Nenhuma credencial, token ou API key no codigo |
| Erros nao vazam detalhes internos | OK | `classifyEntry` silencia erros de `lstat` retornando `"absent"` — comportamento seguro e intencional |
| Sem execucao de codigo arbitrario | OK | Nenhum `eval`, `exec`, `spawn` com input externo |
| Recursos liberados corretamente | OK | `rl.close()` no bloco `finally` garante liberacao do readline mesmo em excecao |
| Sem renderizacao de HTML nao sanitizado | N/A | CLI sem frontend |
| Inputs validados | N/A | Inputs sao caminhos de filesystem do proprio CLI, nao dados de usuario externo |
| Autenticacao/autorizacao | N/A | CLI local, sem endpoints |

## Aderencia a TechSpec

| Decisao Tecnica | Implementado | Observacoes |
|-----------------|--------------|-------------|
| Interface `MigrationPlan` com `realDirs[]`, `filesPreserved[]`, `actions[]` | SIM | Assinatura identica ao especificado em §Interfaces Principais |
| `detectMigration(targetClaude: string): Promise<MigrationPlan | null>` | SIM | Assinatura exata |
| `confirmMigration(plan: MigrationPlan): Promise<boolean>` | SIM | Assinatura exata |
| Varredura de `.claude/{skills,agents,rules,templates,validation}` | SIM | `EXPECTED_SUBDIRS` cobre todos os 5 subdiretorios especificados |
| `fs.lstat()` com `!isSymbolicLink() && isDirectory()` | SIM | `classifyEntry` implementa exatamente essa logica |
| Retorna `null` quando nao ha dirs reais | SIM | Guard `if (realDirs.length === 0) return null` |
| `settings.json` e `settings.local.json` em `filesPreserved` | SIM | `PRESERVED_FILES` constante, `collectPreservedFiles` verifica existencia via `existsSync` |
| `actions[]` com lista numerada de etapas | SIM | `buildActions` gera "N. Mover" + "N+1. Criar symlink" por dir real |
| `confirmMigration` usa `readline.createInterface` (consistente com `prompt.ts`) | SIM | Usa `readline/promises` com `stdin`/`stdout` |
| Default seguro `false` para confirmacao | SIM | Aceita apenas `"s"` ou `"sim"` explicitamente; qualquer outra entrada retorna `false` |
| Exibe plano com `chalk` em pt-BR | SIM | Usa `chalk.yellow`, `chalk.white`, `chalk.green` com mensagens em pt-BR |
| Sem I/O lateral em funcoes de parse (separacao de responsabilidades) | SIM | `buildActions` e `collectPreservedFiles` sao funcoes puras (sem I/O); I/O centralizado em `detectMigration` e `confirmMigration` |
| Sem libs externas alem de chalk | SIM | Usa apenas modulos nativos Node.js (`fs/promises`, `readline/promises`, `path`, `process`) e `chalk` (ja dependencia do projeto) |

## Tasks Verificadas

| Subtarefa | Status | Observacoes |
|-----------|--------|-------------|
| 7.1 Criar `migration.ts` com `detectMigration`, `confirmMigration` e `MigrationPlan` | COMPLETA | Todos os tres exportados corretamente |
| 7.2 Varredura com `lstat()` e `!isSymbolicLink() && isDirectory()` | COMPLETA | Implementado em `classifyEntry` |
| 7.3 `actions[]` numeradas (Mover + Criar symlink por dir) | COMPLETA | Contador sequencial, 2 acoes por dir real |
| 7.4 `confirmMigration` com `readline.createInterface` | COMPLETA | Consistente com padrao do projeto |
| 7.5 Testes unitarios em `migration.spec.ts` | COMPLETA | 11 cenarios, todos passando |

## Testes

- Total de Testes (suite completa): 44
- Testes de migration.spec.ts: 11
- Passando: 44 / 44
- Falhando: 0
- Coverage: nao mensurado (`@vitest/coverage-v8` nao instalado — fora do escopo desta task)

### Cenarios cobertos em migration.spec.ts

| # | Cenario | Tipo |
|---|---------|------|
| 1 | Dir real `.claude/skills/` detectado em `realDirs` | Caminho feliz |
| 2 | Multiplos dirs reais detectados | Caminho feliz |
| 3 | Tudo ja e symlink — retorna `null` | Edge case |
| 4 | Nenhum subdir reconhecido — retorna `null` | Edge case |
| 5 | `settings.json` presente em `filesPreserved` | Caminho feliz |
| 6 | `settings.local.json` presente em `filesPreserved` | Caminho feliz |
| 7 | Ambos os settings presentes em `filesPreserved` | Combinacao |
| 8 | Nenhum settings presente — `filesPreserved` vazio | Edge case |
| 9 | `actions[]` numeradas corretamente (1., 2.) | Verificacao de formato |
| 10 | Acoes de Mover e Criar symlink por dir real | Verificacao de conteudo |
| 11 | Symlinks ignorados; apenas dirs reais coletados | Cenario misto |

Todos os cenarios obrigatorios da task (detecta dir real, retorna null quando symlinks, preserva settings) estao cobertos, com cobertura adicional de edge cases (ausencia total de subdirs, settings nao existentes, cenario misto symlink+dir real).

Observacao: `confirmMigration` nao testado automaticamente — excluido explicitamente nos criterios de sucesso da task por ser interativo. Validacao manual e responsabilidade do implementador conforme task 7.0 §Criterios de Sucesso.

## Problemas Encontrados

Nenhum problema bloqueante identificado. Observacoes de baixa severidade:

| Severidade | Arquivo | Linha | Descricao | Sugestao |
|------------|---------|-------|-----------|----------|
| Baixa | `migration.ts` | 17 | `classifyEntry` retorna `"absent"` tanto para ausencia do path quanto para path que e arquivo regular (nao-dir, nao-symlink). O nome do tipo de retorno pode gerar confusao futura | Considerar renomear para `"not-a-real-dir"` ou documentar o comportamento combinado com comentario pontual |
| Baixa | `migration.ts` | 84 | `rl` (2 chars) e uma abreviacao curta, ainda que idiomatica para readline | Baixo impacto; aceitavel pelo contexto. Alternativa: `readlineInterface` |

## Pontos Positivos

- Separacao de responsabilidades exemplar: `classifyEntry` (I/O atomico), `buildActions` (geracao pura de strings), `collectPreservedFiles` (filtragem pura), `detectMigration` (orquestracao), `confirmMigration` (UI) — cada funcao tem uma unica responsabilidade
- `rl.close()` em bloco `finally` demonstra cuidado com recursos, evitando vazamento de handles mesmo em excecao
- Default seguro na confirmacao: qualquer entrada diferente de `"s"` ou `"sim"` resulta em `false` (nao prossegue) — design defensivo correto para operacao destrutiva
- Constantes nomeadas `EXPECTED_SUBDIRS` e `PRESERVED_FILES` eliminam magic strings e facilitam manutencao futura
- Testes usam `tmpdir` real (sem mock de FS), conforme exigido pela TechSpec ("Mocks: nenhum mock de FS")
- 11 cenarios de teste para uma funcao com escopo M — cobertura bem acima do minimo exigido (3 cenarios)
- Tratamento de erro silencioso em `classifyEntry` e intencional e correto: path ausente e equivalente a "nao precisa migrar"

## Recomendacoes

1. (Opcional) Renomear o tipo de retorno `"absent"` de `classifyEntry` para `"not-a-real-dir"` para deixar explicito que engloba tanto ausencia quanto arquivos regulares. Nao bloqueia aprovacao.
2. (Futuro) Quando `install.ts` (Task 8.0) integrar `migration.ts`, validar que o parametro `force` e gerenciado corretamente no orquestrador e nao dentro deste modulo, mantendo a separacao de responsabilidades ja estabelecida aqui.

## Conclusao

A implementacao de `src/lib/migration.ts` esta completa, correta e bem estruturada. Todos os 5 subtasks foram concluidos. A interface publica corresponde exatamente ao contrato definido na TechSpec. Os 11 testes cobrem os 3 cenarios obrigatorios da task mais 8 cenarios adicionais de edge case, usando tmpdir real sem mock de FS conforme exigido. O conjunto de 44 testes da suite completa passa sem erros. O codigo segue as rules do projeto (`code-standards.md`) sem violacoes. Nenhum problema de seguranca identificado. Os dois pontos de baixa severidade registrados sao meramente cosmeticos e nao impactam corretude ou manutencao.
