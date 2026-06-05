# Tarefa 7.0: Bootstrap tri-plataforma (skill `kspec-bootstrap`)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 3.0 (o bootstrap gera `CURSOR.bootstrap.md` a partir do `cursor-md-template.md`)

## Estimativa

- **Tamanho**: G
- **Horas estimadas**: 4-8h

## Visão Geral

Estender a skill `kspec-bootstrap` para perguntar quais plataformas configurar (Claude / Codex / Cursor / combinações / Todas), gerar os `*.bootstrap.md` correspondentes sem sobrescrever finais, e oferecer opt-in de MCP por plataforma (Codex → `.codex/config.toml`; Cursor → `.cursor/mcp.json`), sempre com default **Não**.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — clareza nas instruções da skill.
- `.agents/rules/logging.md` — saída pt-BR e mensagens de erro com causa + próxima ação.
</skills>

<requirements>
- Pergunta "Quais plataformas devem ser configuradas?" com opções: Claude apenas, Codex apenas, Cursor apenas, combinações parciais e **Todas (Recomendado)**. (RF4.1)
- Conforme a resposta, gera `CLAUDE.bootstrap.md`, `AGENTS.bootstrap.md`, `CURSOR.bootstrap.md` ou combinação — nunca sobrescreve arquivos finais existentes. (RF4.2)
- MCP opt-in **por plataforma**: Codex → `.codex/config.toml`; Cursor → `.cursor/mcp.json`; default **Não** em ambos; escrita só com confirmação. (RF4.3)
- Fallback de perguntas: `AskQuestion` no Cursor; texto numerado se ferramenta indisponível. (RF4.4)
- Modo não-interativo (Codex `exec`) documenta limitação e aborta com mensagem clara. (RF4.5)
- Matriz de geração documentada na skill cobrindo todas as combinações de 3 plataformas.
- Editar o source of truth em `.agents/skills/kspec-bootstrap/SKILL.md` (paridade via symlinks).
</requirements>

## Subtarefas

- [ ] 7.1 Adicionar a pergunta de seleção de plataformas (com "Todas").
- [ ] 7.2 Implementar a matriz de geração dos `*.bootstrap.md` (sem sobrescrever finais).
- [ ] 7.3 Adicionar opt-in de MCP por plataforma (Codex/Cursor), default Não.
- [ ] 7.4 Documentar limitação do modo não-interativo e o fallback de perguntas.

## Detalhes de Implementação

Ver `prd.md` → REQ-004 e `techspec.md` → "Pontos de Integração" (MCP opt-in, schema `mcpServers`). Editar `.agents/skills/kspec-bootstrap/SKILL.md`.

## Critérios de Sucesso

- A matriz cobre todas as combinações das 3 plataformas.
- Opt-in de MCP nunca grava config sem confirmação explícita.
- `*.bootstrap.md` nunca sobrescreve arquivos finais existentes.

## Testes da Tarefa

- [ ] Testes de unidade (N/A — conteúdo de skill)
- [ ] Testes de integração: revisão da matriz e dry-run das combinações de geração; verificação de que nenhum final é sobrescrito.
- [ ] Testes E2E: invocação manual do `kspec-bootstrap` no Cursor com escolha "Todas".

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `.agents/skills/kspec-bootstrap/SKILL.md` — source of truth da skill.
- `.agents/templates/cursor-md-template.md` — base do `CURSOR.bootstrap.md`.
