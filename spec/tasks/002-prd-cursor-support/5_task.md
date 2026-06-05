# Tarefa 5.0: Distribuição e versionamento 1.3.0

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Dependências

- 2.0 (camada `.cursor/` gerada)
- 3.0 (`CURSOR.md` existe para entrar em `package.json#files`)

## Estimativa

- **Tamanho**: P
- **Horas estimadas**: < 2h

## Visão Geral

Atualizar a distribuição e a versão do pacote: incluir `.cursor/` e `CURSOR.md` em `package.json#files`, bump de `1.2.x` para `1.3.0` em `package.json` e `VERSION`, e adicionar `cursor` em `description`/`keywords`.

<skills>
### Conformidade com Skills Padrões

- `.agents/rules/code-standards.md` — consistência de metadados do pacote.
</skills>

<requirements>
- `package.json#files` inclui `.cursor/` e `CURSOR.md` (além dos artefatos existentes). (RF3.4)
- `package.json#version` e `VERSION` em **1.3.0**. (RF6.3)
- `description` e `keywords` incluem `cursor`. (RF6.3)
</requirements>

## Subtarefas

- [ ] 5.1 Atualizar `package.json#files` (`.cursor/`, `CURSOR.md`).
- [ ] 5.2 Bump de versão em `package.json` e `VERSION` para `1.3.0`.
- [ ] 5.3 Atualizar `description`/`keywords` com `cursor`.

## Detalhes de Implementação

Ver `techspec.md` → "Verificações Técnicas → Infraestrutura" (Distribuição) e "Considerações Técnicas".

## Critérios de Sucesso

- Tarball npm (`npm pack --dry-run`) inclui `.cursor/` e `CURSOR.md`.
- `package.json` e `VERSION` reportam `1.3.0`.
- `keywords` contém `cursor`.

## Testes da Tarefa

- [ ] Testes de unidade (N/A — alteração de metadados)
- [ ] Testes de integração: `npm pack --dry-run` lista `.cursor/` e `CURSOR.md`; validado também no smoke/prepublish (6.0).
- [ ] Testes E2E (N/A)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `package.json` — `files`, `version`, `description`, `keywords`.
- `VERSION` — `1.3.0`.
