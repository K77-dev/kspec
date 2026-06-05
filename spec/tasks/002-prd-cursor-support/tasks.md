# Resumo de Tarefas de Implementação de Suporte ao Cursor no kspec (v1.3.0)

**Legenda de tamanho**: P (< 2h) | M (2-4h) | G (4-8h) | GG (> 8h)

## Tarefas

- [x] 1.0 Conversor `.md → .mdc` (`ruleToMdc`) + testes unitários [M]
- [x] 2.0 Funções Cursor em `install.ts` + `paths.ts` (depende: 1.0) [G]
- [x] 3.0 `CURSOR.md` + `cursor-md-template.md` + extensão de `ensureRootDocs` (depende: 2.0) [M]
- [x] 4.0 Detecção de migração e sumário de instalação para Cursor (depende: 2.0) [M]
- [x] 5.0 Distribuição e versionamento 1.3.0 (`package.json`, `VERSION`) (depende: 2.0, 3.0) [P]
- [x] 6.0 Smoke test + prepublish-check tri-plataforma (depende: 2.0, 3.0, 4.0, 5.0) [M]
- [x] 7.0 Bootstrap tri-plataforma (skill `kspec-bootstrap`) (depende: 3.0) [G]
- [x] 8.0 Paridade de skills e agents no Cursor [M]
- [x] 9.0 Documentação tri-plataforma (`README.md`, `AGENTS.md`, `CLAUDE.md`) (depende: 3.0, 7.0, 8.0) [M]
