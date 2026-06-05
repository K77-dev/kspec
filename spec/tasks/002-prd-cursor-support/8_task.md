# Tarefa 8.0: Paridade de skills e agents no Cursor

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- Nenhuma

## Estimativa

- **Tamanho**: M
- **Horas estimadas**: 2-4h

## Visão Geral

Garantir semântica equivalente das skills e agents no Cursor: `kspec-version` imprime a linha de plataformas incluindo Cursor; `kspec-implement` e `kspec-qa` documentam delegação via Task tool (`subagent_type`) com fallback inline; refs `@.agents/...` permanecem canônicas. Edições no source of truth `.agents/skills/`.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — clareza e consistência das instruções de skill.
- `.agents/rules/logging.md` — saída pt-BR.
</skills>

<requirements>
- As 9 skills `kspec-*` invocáveis no Cursor Agent (sem caminhos exclusivos de uma plataforma como source of truth). (RF5.1, RF5.4)
- `kspec-implement` delega `kspec-task-runner` e `kspec-review-runner` via Task tool; fallback inline com aviso se indisponível. (RF5.2)
- `kspec-qa` delega `kspec-qa-runner` via Task tool; mesmo fallback. (RF5.3)
- `kspec-version` imprime "Plataformas suportadas: Claude Code, OpenAI Codex CLI, Cursor". (RF5.5)
- Mecanismo de descoberta de subagents custom no Cursor coerente com a Tech Spec (decisão: `.cursor/agents/` por symlink + reforço via `.agents/agents/`). (RF5.6)
- Editar source of truth em `.agents/skills/...` (paridade via symlinks).
</requirements>

## Subtarefas

- [x] 8.1 Atualizar `kspec-version` (linha de plataformas com Cursor).
- [x] 8.2 Atualizar `kspec-implement` (delegação Task tool + fallback inline).
- [x] 8.3 Atualizar `kspec-qa` (delegação Task tool + fallback inline).
- [x] 8.4 Revisar refs `@.agents/...` para manter canonicidade (sem duplicação Cursor).

## Detalhes de Implementação

Ver `prd.md` → REQ-005 e `techspec.md` → "Considerações Técnicas → Decisões Principais / Riscos (R1)". Editar `.agents/skills/kspec-version/SKILL.md`, `.agents/skills/kspec-implement/SKILL.md`, `.agents/skills/kspec-qa/SKILL.md`.

## Critérios de Sucesso

- `kspec-version` lista as três plataformas.
- `kspec-implement`/`kspec-qa` descrevem delegação via `subagent_type` com fallback.
- Nenhuma skill referencia caminho exclusivo de uma única plataforma como source of truth.

## Testes da Tarefa

- [ ] Testes de unidade (N/A — conteúdo de skill)
- [ ] Testes de integração: revisão de coerência das skills (refs canônicas, fallback descrito).
- [ ] Testes E2E: invocar `kspec-version` e `kspec-prd` no Cursor Agent; confirmar os 3 `subagent_type` disponíveis.

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/skills/kspec-version/SKILL.md`
- `.agents/skills/kspec-implement/SKILL.md`
- `.agents/skills/kspec-qa/SKILL.md`
