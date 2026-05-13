# Relatório de Code Review — Task 12.0: scripts/smoke.sh e scripts/prepublish-check.sh

## Resumo

- **Data**: 2026-05-12
- **Branch**: 001-prd-codex-cli-support
- **Status**: APROVADO
- **Arquivos Modificados**: 2 novos (scripts/smoke.sh, scripts/prepublish-check.sh) + 1 modificado (package.json)
- **Linhas Adicionadas**: ~230 (scripts) + 8 (package.json)
- **Linhas Removidas**: 2 (package.json — substituição do prepublishOnly anterior)
- **Re-review**: 2026-05-12 — correções aplicadas e verificadas

---

## Conformidade com Rules

| Rule | Status | Observações |
|------|--------|-------------|
| code-standards.md | N/A | Task 12.0 declara explicitamente "N/A (shell)" |
| logging.md (pt-BR + →/✓/✗) | OK | Ambos os scripts usam →, ✓, ✗ corretamente. Mensagens em pt-BR. |
| graphify.md | N/A | Não há graphify-out/ no projeto |

---

## Aderência à TechSpec

| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| smoke.sh executa kspec init em tmpdir | SIM | Usa /tmp/kspec-smoke-$$ com tmpdir único por PID |
| smoke.sh: asserts de estrutura do Cenário 1 | SIM | 6 asserts: .agents files ≥23, .claude symlinks ≥12, kspec-task-runner.toml, sandbox workspace-write, sandbox read-only, AGENTS.md e CLAUDE.md |
| smoke.sh: cenário de migração com resposta "n" | SIM | echo "n" | kspec init; verifica output com grep |
| smoke.sh: idempotência via kspec update 2× seguidas | SIM | Corrigido: executa kspec update (1ª), captura SYMLINKS_AFTER_FIRST, kspec update (2ª), captura SYMLINKS_AFTER_SECOND, compara. Conforme especificado na task e techspec. |
| prepublish-check.sh valida symlinks .claude/ e .codex/ | SIM | Cobre .claude/rules, templates, validation, skills/*, agents/*, .codex/skills/* |
| prepublish-check.sh: exit 1 em symlink quebrado | SIM | Confirmado pela lógica FAIL++ e exit 1 final |
| prepublish-check.sh: mitigação R5 (drift) | SIM | Valida readlink -f resolve para .agents/ |
| package.json scripts.smoke | SIM | "smoke": "bash scripts/smoke.sh" |
| package.json prepublishOnly | SIM | "npm run build && bash scripts/prepublish-check.sh" |
| Exit codes claros (0 = passou, !=0 = falhou) | SIM | Ambos os scripts |
| Scripts portáveis (bash 4+, sem deps exóticas) | SIM | set -euo pipefail, shebang #!/usr/bin/env bash |

---

## Tasks Verificadas

| Subtarefa | Status | Observações |
|-----------|--------|-------------|
| 12.1 — Criar scripts/smoke.sh com set -euo pipefail e asserts | COMPLETA | Todos os asserts exigidos presentes. 3 cenários estruturados. Cenário 3 corrigido para 2 updates consecutivos. |
| 12.2 — Criar scripts/prepublish-check.sh cobrindo .claude/{skills,agents,rules,templates,validation} e .codex/skills/ | COMPLETA | Cobre todos os paths especificados |
| 12.3 — Atualizar package.json scripts: smoke e prepublishOnly | COMPLETA | Ambos os scripts adicionados corretamente |
| 12.4 — Rodar npm run smoke e confirmar exit 0 | COMPLETA | 8/8 PASS, exit 0 confirmado neste re-review |
| 12.5 — Rodar bash scripts/prepublish-check.sh e confirmar exit 0 | COMPLETA | Exit 0 confirmado neste re-review |

---

## Testes

- **Testes Vitest**: 99 passando / 0 falhando (8 arquivos de teste)
- **smoke.sh (npm run smoke)**: 8/8 PASS — exit 0
- **Build**: OK (dist/index.js 17.07 KB, 7ms)
- **Coverage**: Não configurada formalmente (sem relatório de cobertura); testes unitários cobrem agent-toml, migration, platform, install, commands, paths e prompt

---

## Problemas Encontrados

Nenhum problema bloqueante ou de severidade média/alta identificado neste re-review.

| Severidade | Arquivo | Linha | Descrição | Status |
|------------|---------|-------|-----------|--------|
| Baixa (resolvida) | scripts/smoke.sh | 126-137 | Cenário 3 executava apenas 1 kspec update após init em vez de 2 consecutivos. | CORRIGIDO — agora executa 2 updates consecutivos e compara o estado de symlinks antes e depois do 2º update. |
| Baixa (resolvida) | scripts/prepublish-check.sh | — | Ausência de bit de execução (+x). | CORRIGIDO — ambos os scripts têm -rwxr-xr-x confirmado via ls -la. |
| Baixa (pendente outra task) | package.json | 12-17 | O campo "files" não inclui ".agents/", ".codex/" e "AGENTS.md" conforme RF4.5. Não é responsabilidade desta task (12.0). | Pendente — tech debt de outra task, não bloqueia aprovação da 12.0. |

---

## Pontos Positivos

- Uso correto de `set -euo pipefail` em ambos os scripts, garantindo falha explícita em erros de shell.
- Uso de PID (`$$`) no nome do diretório temporário evita colisão entre execuções paralelas.
- Trap `cleanup()` com `EXIT` garante limpeza mesmo em falha.
- Funções de assert nomeadas (`assert_gte`, `assert_file_exists`, `assert_grep`, `assert_true`) tornam o script legível e extensível.
- O prepublish-check.sh usa process substitution (`< <(find ...)`) com `-print0` e `read -d ''` para lidar corretamente com nomes de arquivos com espaços.
- Mensagens de output são claras e construtivas, seguindo o padrão do projeto.
- O cenário de migração valida output com grep -qiE cobrindo variações de encoding (migração/migração/abort).
- readlink -f funciona corretamente em macOS (confirmado em execução real).
- 99 testes Vitest passando sem nenhuma falha.
- Cenário 3 agora implementa corretamente a lógica de duplo update com comparação de estado, exatamente conforme especificado.

---

## Recomendações

1. **Campo "files" no package.json**: verificar se task 9.0 ou outra task cobre a inclusão de `.agents/`, `.codex/` e `AGENTS.md` no tarball (RF4.5). Criar task complementar se nenhuma task cobrir esse ponto.

---

## Conclusão

Todas as ressalvas do review anterior foram endereçadas. O Cenário 3 do smoke.sh agora executa dois `kspec update` consecutivos e compara o estado de symlinks entre a primeira e a segunda execução — conforme especificado na task e na techspec. O `scripts/prepublish-check.sh` possui permissão de execução (`-rwxr-xr-x`), em paridade com `smoke.sh`. O `npm run smoke` retornou 8/8 PASS com exit 0 e `npm test` retornou 99/99 PASS. O build foi concluído com sucesso.

O único ponto pendente (campo `files` no package.json) não é responsabilidade desta task e não bloqueia aprovação.

**Status: APROVADO**
