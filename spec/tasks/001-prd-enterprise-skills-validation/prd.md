# PRD: Validação de Skills Empresariais

## Visão Geral

O projeto kspec possui um conjunto de skills que orquestram o fluxo de desenvolvimento (PRD, Tech Spec, Tasks, Implementação, QA, Bugfix). Essas skills dependem de skills empresariais padronizadas, mantidas centralmente no repositório `K77-dev/enterprise-platform-skills`, que estabelecem padrões de segurança e conformidade definidos pela empresa.

Atualmente, não existe nenhum mecanismo que garanta a presença dessas skills empresariais no ambiente do desenvolvedor. Um dev pode executar qualquer skill kspec sem ter as skills obrigatórias instaladas, comprometendo os padrões corporativos.

Esta funcionalidade adiciona uma camada de validação automática que verifica a presença e integridade das skills empresariais em dois momentos: durante o bootstrap do projeto e na invocação de qualquer skill kspec. Quando ausentes ou desatualizadas, as skills são instaladas/atualizadas automaticamente.

## Objetivos

- **Conformidade 100%**: nenhuma skill kspec deve executar sem que todas as skills empresariais obrigatórias estejam presentes e íntegras
- **Zero fricção**: a instalação automática elimina etapas manuais para o desenvolvedor
- **Integridade verificável**: uso de hash para garantir que as skills instaladas correspondem à versão oficial do repositório empresarial
- **Escalabilidade dinâmica**: novas skills adicionadas ao repositório empresarial são automaticamente exigidas, sem necessidade de atualização manual no projeto

## Histórias de Usuário

### Desenvolvedor

- Como desenvolvedor, eu quero que ao executar qualquer skill kspec (ex: `/kspec-prd`, `/kspec-techspec`) as skills empresariais sejam automaticamente validadas e instaladas para que eu não precise configurar manualmente e tenha certeza de estar em conformidade
- Como desenvolvedor, eu quero receber feedback claro no terminal sobre o status da validação (instalando, atualizando, validado) para que eu entenda o que está acontecendo
- Como desenvolvedor, eu quero que o processo de instalação automática seja rápido e não interrompa meu fluxo de trabalho

### Tech Lead

- Como tech lead, eu quero que todos os projetos que usam kspec exijam automaticamente as skills empresariais definidas centralmente para que eu tenha garantia de que os padrões da empresa estão sendo seguidos
- Como tech lead, eu quero que ao adicionar uma nova skill obrigatória no repositório empresarial, ela seja automaticamente exigida em todos os projetos na próxima execução de qualquer skill kspec
- Como tech lead, eu quero que a verificação de integridade via hash impeça que skills sejam modificadas localmente de forma não autorizada

## Funcionalidades Principais

### F1 — Validação no Bootstrap

Ao executar a skill `kspec-bootstrap`, o sistema deve verificar e instalar todas as skills empresariais obrigatórias.

**Requisitos funcionais:**

1. RF1.1 — Buscar o arquivo `skills-lock.json` do repositório `K77-dev/enterprise-platform-skills` via GitHub API
2. RF1.2 — Para cada skill listada no `skills-lock.json`, verificar se existe localmente no diretório `.claude/skills/` e `.agents/skills/` do projeto
3. RF1.3 — Para skills ausentes, baixar automaticamente todos os arquivos da skill do repositório empresarial e instalá-los nos diretórios corretos
4. RF1.4 — Gerar/atualizar um arquivo local `enterprise-skills-lock.json` na raiz do projeto com os hashes das skills instaladas
5. RF1.5 — Exibir no terminal um resumo das skills instaladas/atualizadas

### F2 — Validação na Invocação de Skills

Cada vez que uma skill kspec for invocada, o sistema deve verificar se as skills empresariais estão presentes e íntegras.

**Requisitos funcionais:**

6. RF2.1 — Antes de executar qualquer skill kspec, verificar a existência do arquivo local `enterprise-skills-lock.json`
7. RF2.2 — Se o arquivo não existir, executar o fluxo completo de instalação (mesma lógica do bootstrap)
8. RF2.3 — Se o arquivo existir, comparar os hashes locais com os hashes do repositório remoto
9. RF2.4 — Se houver divergência de hash (skill desatualizada ou modificada), reinstalar a skill automaticamente e atualizar o lock local
10. RF2.5 — Se a validação falhar por erro de rede (repositório inacessível), exibir aviso mas permitir execução se as skills já estiverem instaladas localmente com hash válido no lock local
11. RF2.6 — Se as skills não estiverem instaladas e não for possível baixá-las, bloquear a execução da skill kspec e exibir instruções de resolução

### F3 — Instalação Automática de Skills

O sistema deve ser capaz de baixar e instalar skills do repositório empresarial de forma transparente.

**Requisitos funcionais:**

12. RF3.1 — Baixar o conteúdo de cada skill (SKILL.md, README.md, QUICK_REFERENCE.md, diretório de testes e outros arquivos) via GitHub API
13. RF3.2 — Instalar os arquivos no diretório `.agents/skills/[nome-skill]/` do projeto
14. RF3.3 — Criar symlink em `.claude/skills/[nome-skill]` apontando para `../../.agents/skills/[nome-skill]` (seguindo o mesmo padrão do repositório empresarial)
15. RF3.4 — Calcular e armazenar o hash SHA-256 dos arquivos instalados no `enterprise-skills-lock.json` local

### F4 — Verificação de Integridade via Hash

O sistema deve garantir que as skills instaladas correspondem exatamente à versão oficial.

**Requisitos funcionais:**

16. RF4.1 — Utilizar o campo `computedHash` do `skills-lock.json` remoto como fonte de verdade
17. RF4.2 — Comparar o hash remoto com o hash armazenado no lock local para detectar atualizações no repositório empresarial
18. RF4.3 — Recalcular o hash dos arquivos locais para detectar modificações não autorizadas
19. RF4.4 — Quando houver divergência entre hash local e remoto, reinstalar a skill e notificar o desenvolvedor

### F5 — Descoberta Dinâmica de Skills Obrigatórias

O sistema deve descobrir automaticamente quais skills são obrigatórias lendo o repositório empresarial.

**Requisitos funcionais:**

20. RF5.1 — Ler o `skills-lock.json` do repositório `K77-dev/enterprise-platform-skills` para obter a lista de skills obrigatórias
21. RF5.2 — Tratar cada entrada no campo `skills` do JSON como uma skill obrigatória
22. RF5.3 — Quando novas skills forem adicionadas ao `skills-lock.json` remoto, detectá-las automaticamente na próxima validação
23. RF5.4 — Quando skills forem removidas do `skills-lock.json` remoto, remover os arquivos locais correspondentes e atualizar o lock local

## Experiência do Usuário

### Persona: Desenvolvedor

O desenvolvedor interage com as skills kspec no terminal. A validação deve ser transparente e minimamente intrusiva.

**Fluxo principal — Skills já instaladas e atualizadas:**
1. Dev executa `/kspec-prd`
2. Sistema verifica `enterprise-skills-lock.json` — skills presentes e hashes válidos
3. Mensagem breve: `✓ Skills empresariais validadas`
4. Skill kspec executa normalmente

**Fluxo — Skills ausentes (primeira vez):**
1. Dev executa `/kspec-prd`
2. Sistema detecta ausência de `enterprise-skills-lock.json`
3. Mensagem: `Instalando skills empresariais obrigatórias...`
4. Para cada skill: `  → Instalando cybersecurity-analyst... OK`
5. Mensagem: `✓ 1 skill empresarial instalada`
6. Skill kspec executa normalmente

**Fluxo — Skill desatualizada:**
1. Dev executa `/kspec-techspec`
2. Sistema detecta divergência de hash
3. Mensagem: `Atualizando skills empresariais...`
4. `  → Atualizando cybersecurity-analyst... OK`
5. Mensagem: `✓ 1 skill atualizada`
6. Skill kspec executa normalmente

**Fluxo — Sem conexão e sem skills instaladas:**
1. Dev executa `/kspec-tasks`
2. Sistema não consegue acessar o repositório remoto e skills não estão instaladas
3. Mensagem de erro: `✗ Skills empresariais obrigatórias não encontradas. Conecte-se à internet e tente novamente, ou execute /kspec-bootstrap para instalar.`
4. Skill kspec NÃO executa

### Considerações de UI/UX

- Mensagens no terminal devem ser concisas e usar indicadores visuais (checkmark, seta, X)
- O progresso da instalação deve ser visível skill por skill
- Erros devem incluir instruções claras de resolução
- A validação não deve adicionar mais de 2-3 segundos ao tempo de execução quando as skills já estão instaladas

### Acessibilidade

- Mensagens devem funcionar em terminais sem suporte a cores (fallback para texto puro)
- Não depender exclusivamente de cores para comunicar status (usar símbolos textuais)

## Restrições Técnicas de Alto Nível

- **Integração com repositório git**: acesso ao repositório empresarial via operações git padrão (`git clone`/`git pull`). A solução deve ser agnóstica de provedor — funcionar com GitHub, Azure DevOps, GitLab ou qualquer hosting git acessível via URL
- **Compatibilidade com estrutura existente**: as skills instaladas devem seguir o mesmo padrão de diretórios do repositório empresarial (`.agents/skills/` com symlinks em `.claude/skills/`)
- **Performance**: a verificação de hash local deve ser rápida (< 1s); a verificação remota não deve exceder 3s em condições normais de rede
- **Idempotência**: executar a validação múltiplas vezes deve produzir o mesmo resultado sem efeitos colaterais
- **Compatibilidade de plataforma**: deve funcionar em macOS e Linux (ambientes onde o kspec é utilizado)

## Fora de Escopo

- **Gestão de permissões**: não será implementado controle de quem pode alterar a lista de skills obrigatórias no repositório empresarial — isso é responsabilidade do controle de acesso do GitHub
- **Interface gráfica/dashboard**: toda interação é via terminal/CLI
- **Versionamento granular de skills**: não haverá suporte a múltiplas versões da mesma skill instaladas simultaneamente — sempre será usada a versão mais recente do repositório empresarial
- **Cache offline persistente**: não será implementado um mecanismo de cache offline para cenários prolongados sem internet — a validação offline usa apenas o lock local existente
- **Notificações push**: o sistema não notificará proativamente sobre atualizações — a verificação ocorre apenas nos momentos definidos (bootstrap e invocação de skills)
