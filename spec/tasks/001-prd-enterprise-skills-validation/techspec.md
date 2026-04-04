# Tech Spec: Validação de Skills Empresariais

## Resumo Executivo

A validação de skills empresariais será implementada como **instruções Markdown declarativas** inseridas em cada SKILL.md e AGENT.md do projeto. Não haverá código TypeScript compilado — o agente Claude executará a lógica de validação usando **operações git padrão** (`git clone`/`git pull`) para acessar o repositório empresarial, comparar hashes e instalar/atualizar skills automaticamente.

A solução é **agnóstica de provedor git** — funciona com GitHub, Azure DevOps, GitLab ou qualquer hosting git acessível via URL. A URL do repositório é configurada no lock file local, permitindo migração de provedor sem alterar a lógica de validação.

A estratégia é: **um bloco de instruções reutilizável** referenciado por todas as skills/agents como passo obrigatório "Passo 0", executado antes de qualquer outra lógica. O lock file local (`enterprise-skills-lock.json`) será versionado no repositório para garantir consistência entre devs.

## Arquitetura do Sistema

### Visão Geral dos Componentes

**Componentes novos:**

- **Bloco de validação compartilhado** (`.claude/validation/enterprise-skills-check.md`) — Documento Markdown com as instruções passo a passo que o agente Claude deve seguir para validar skills empresariais. Referenciado por todos os SKILL.md e AGENT.md via notação `@`.
- **Lock file local** (`enterprise-skills-lock.json` na raiz) — Arquivo JSON que registra as skills empresariais instaladas, seus hashes e timestamps. Commitado no repositório.

**Componentes modificados:**

- **Todos os 8 SKILL.md** — Adição de "Passo 0: Validação de Skills Empresariais" no início do fluxo de trabalho, referenciando o bloco compartilhado.
- **Todos os 3 AGENT.md** — Adição do mesmo passo de validação antes da execução de tarefas.
- **.gitignore** — Garantir que `enterprise-skills-lock.json` NÃO está ignorado (deve ser commitado).

**Fluxo de dados:**

```
Invocação de skill kspec
  → Passo 0: Ler enterprise-skills-lock.json local
  → git clone/pull: Clonar ou atualizar repo empresarial em diretório temporário
  → Ler skills-lock.json do clone local
  → Comparar hashes (local vs remoto)
  → Se divergência: copiar arquivos da skill do clone para o projeto
  → Instalar em .agents/skills/ + criar symlink em .claude/skills/
  → Atualizar enterprise-skills-lock.json local
  → Limpar diretório temporário do clone
  → Prosseguir com skill kspec
```

## Design de Implementação

### Interfaces Principais

**Estrutura do `skills-lock.json` remoto** (fonte de verdade — repo empresarial):

```json
{
  "version": 1,
  "skills": {
    "cybersecurity-analyst": {
      "source": "rysweet/amplihack",
      "sourceType": "github",
      "computedHash": "4f804565a002629ad80e311b460d710783af11bfddda5ddecee18c4b8f54cc0e"
    }
  }
}
```

**Estrutura do `enterprise-skills-lock.json` local** (gerado/atualizado pela validação):

```json
{
  "version": 1,
  "remote": {
    "url": "https://github.com/K77-dev/enterprise-platform-skills.git",
    "branch": "main",
    "provider": "github"
  },
  "lastChecked": "2026-04-04T14:30:00Z",
  "skills": {
    "cybersecurity-analyst": {
      "computedHash": "4f804565a002629ad80e311b460d710783af11bfddda5ddecee18c4b8f54cc0e",
      "installedAt": "2026-04-04T14:30:00Z",
      "files": [
        ".agents/skills/cybersecurity-analyst/SKILL.md",
        ".agents/skills/cybersecurity-analyst/README.md",
        ".agents/skills/cybersecurity-analyst/QUICK_REFERENCE.md"
      ]
    }
  }
}
```

O campo `remote` centraliza a configuração do repositório:
- **`url`**: URL git clone do repositório (funciona com qualquer provedor: GitHub, Azure DevOps, GitLab, Bitbucket, etc.)
- **`branch`**: Branch a ser consultada (default: `main`)
- **`provider`**: Identificador informativo do provedor (não afeta a lógica — apenas para mensagens de erro contextualizadas)

Para migrar de provedor, basta alterar `remote.url` e `remote.provider`. A lógica de validação permanece idêntica.

### Modelos de Dados

**Contrato de validação** (lógica que o agente Claude executa):

| Campo | Tipo | Descrição |
|---|---|---|
| `remoteSkills` | `Record<string, { computedHash: string }>` | Skills do `skills-lock.json` remoto |
| `localSkills` | `Record<string, { computedHash: string, files: string[] }>` | Skills do lock local |
| `missingSkills` | `string[]` | Skills presentes no remoto mas ausentes localmente |
| `outdatedSkills` | `string[]` | Skills com hash divergente (remoto ≠ local) |
| `removedSkills` | `string[]` | Skills presentes localmente mas ausentes no remoto |

### Operações Git (agnósticas de provedor)

Não há endpoints HTTP novos nem dependência de CLI específica de provedor. A comunicação com o repositório empresarial usa **operações git padrão**:

| Operação | Comando | Finalidade |
|---|---|---|
| Clone inicial | `git clone --depth 1 --branch {branch} {url} {tmpdir}` | Baixar repo empresarial (shallow clone para performance) |
| Atualização | `git -C {tmpdir} pull --ff-only` | Atualizar clone existente se já em cache |
| Ler lock | `cat {tmpdir}/skills-lock.json` | Obter lista de skills obrigatórias |
| Copiar skill | `cp -r {tmpdir}/.agents/skills/{name}/ .agents/skills/{name}/` | Instalar arquivos da skill no projeto |

O diretório temporário do clone é `.claude/.enterprise-skills-cache/` (adicionado ao `.gitignore`). É reutilizado entre invocações para evitar clones repetidos — um `git pull` é suficiente para atualizar.

## Pontos de Integração

### Repositório Git Empresarial (via `git` CLI)

- **Autenticação**: usa as credenciais git já configuradas no ambiente do dev (SSH keys, credential helpers, tokens). Funciona com qualquer provedor (GitHub, Azure DevOps, GitLab, Bitbucket)
- **Performance**: `--depth 1` limita o clone ao último commit, minimizando tráfego de rede
- **Tratamento de erros**:
  - `git clone/pull` retorna exit code ≠ 0 em falhas de rede ou autenticação
  - Se falhar E skills já instaladas localmente com hash válido → exibir aviso e permitir execução
  - Se falhar E skills NÃO instaladas → bloquear execução com mensagem de erro e instruções
- **Migração de provedor**: alteração apenas no campo `remote.url` do `enterprise-skills-lock.json`. Nenhuma mudança na lógica de validação

### Estrutura de Diretórios

As skills empresariais seguem o padrão do repositório empresarial:

```
.agents/
└── skills/
    └── cybersecurity-analyst/    ← arquivos reais
        ├── SKILL.md
        ├── README.md
        ├── QUICK_REFERENCE.md
        └── tests/

.claude/
└── skills/
    └── cybersecurity-analyst     ← symlink → ../../.agents/skills/cybersecurity-analyst
```

## Design Detalhado do Bloco de Validação

### Arquivo: `.claude/validation/enterprise-skills-check.md`

Este é o componente central. Contém instruções Markdown que o agente Claude segue ao executar a validação. Todas as skills e agents referenciam este arquivo.

**Algoritmo de validação (em instruções declarativas):**

1. **Ler lock local**: Ler `enterprise-skills-lock.json` da raiz do projeto. Extrair `remote.url` e `remote.branch`.
2. **Obter repo remoto**: Executar `git clone --depth 1 --branch {branch} {url} .claude/.enterprise-skills-cache/` (ou `git pull` se o cache já existir)
3. **Ler lock remoto**: Ler `skills-lock.json` do clone local em `.claude/.enterprise-skills-cache/`
4. **Comparar**:
   - Para cada skill no lock remoto: verificar se existe no lock local com mesmo `computedHash`
   - Para cada skill no lock local: verificar se ainda existe no lock remoto
5. **Ações**:
   - **Skill ausente ou desatualizada** → copiar arquivos de `.claude/.enterprise-skills-cache/.agents/skills/{name}/` para `.agents/skills/{name}/` e criar symlink
   - **Skill removida do remoto** → deletar arquivos locais e symlink automaticamente
   - **Tudo OK** → exibir `✓ Skills empresariais validadas`
6. **Atualizar lock local** com timestamps e hashes atualizados
7. **Fallback offline**: Se `git clone/pull` falhar, verificar se lock local existe e tem skills instaladas. Se sim, exibir aviso e prosseguir. Se não, bloquear.

### Inserção nas Skills (padrão para todos os 8 SKILL.md)

Cada SKILL.md recebe um novo passo antes do fluxo existente:

```markdown
### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.
```

### Inserção nos Agents (padrão para os 3 AGENT.md)

Cada AGENT.md recebe a mesma referência como passo inicial do fluxo.

### Diferenças entre Bootstrap e Invocação

| Aspecto | Bootstrap (`kspec-bootstrap`) | Invocação (demais skills) |
|---|---|---|
| Quando executa | Primeira configuração do projeto | Cada invocação de skill |
| Comportamento se ausente | Sempre instala | Instala se ausente |
| Mensagens | Detalhadas (lista cada skill) | Concisas (resumo) |
| Fallback offline | Bloqueia (é setup inicial) | Permite se lock local válido |

## Abordagem de Testes

### Testes Unitários

Esta funcionalidade é baseada em instruções Markdown, não código TypeScript. Os testes são **verificações manuais de comportamento** dos cenários:

| Cenário | Verificação |
|---|---|
| Lock local ausente + rede OK | Skills instaladas, lock criado, mensagem de instalação |
| Lock local presente + hashes válidos | Mensagem `✓ Skills empresariais validadas`, sem downloads |
| Lock local presente + hash divergente | Skill atualizada, lock atualizado, mensagem de atualização |
| Rede indisponível + skills instaladas | Aviso exibido, skill kspec executa normalmente |
| Rede indisponível + skills ausentes | Execução bloqueada, mensagem de erro com instruções |
| Skill removida do remoto | Arquivos locais deletados, lock atualizado |
| Nova skill adicionada ao remoto | Nova skill instalada automaticamente |

### Testes de Integração

- Executar `/kspec-bootstrap` em um projeto limpo e verificar que as skills empresariais são instaladas
- Executar qualquer skill kspec (ex: `/kspec-prd`) e verificar que a validação ocorre antes do fluxo principal
- Modificar um arquivo de skill local e verificar que a próxima invocação detecta a divergência e reinstala

### Testes E2E

- Fluxo completo: bootstrap → prd → techspec → tasks, verificando que a validação executa em cada etapa sem duplicar downloads desnecessários

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Criar `.claude/validation/enterprise-skills-check.md`** — Bloco de validação compartilhado com toda a lógica declarativa. É a base de tudo.
2. **Criar `enterprise-skills-lock.json` schema** — Definir a estrutura esperada do lock file local para referência.
3. **Modificar `kspec-bootstrap/SKILL.md`** — Inserir passo de validação no bootstrap (ponto de instalação inicial).
4. **Modificar os demais 7 SKILL.md** — Inserir referência ao bloco de validação como Passo 0 em cada skill.
5. **Modificar os 3 AGENT.md** — Inserir referência ao bloco de validação nos agents.
6. **Atualizar `.gitignore`** — Adicionar `.claude/.enterprise-skills-cache/` (clone temporário) ao `.gitignore`. Garantir que `enterprise-skills-lock.json` NÃO é ignorado (deve ser commitado).
7. **Testes manuais** — Executar cenários de validação em projeto limpo e com skills existentes.

### Dependências Técnicas

- **`git` CLI** instalado no ambiente do desenvolvedor (requisito universal — já presente em qualquer ambiente de desenvolvimento)
- **Credenciais git configuradas** para acessar o repositório empresarial (SSH key, HTTPS credential helper, ou PAT — independente do provedor)
- **Acesso ao repositório** empresarial (deve ser público ou o dev deve ter acesso configurado)
- **Permissões de escrita** nos diretórios `.agents/skills/` e `.claude/skills/` do projeto

## Monitoramento e Observabilidade

Não há infraestrutura de monitoramento (Prometheus/Grafana) aplicável — a funcionalidade opera no ambiente local do dev.

**Observabilidade via mensagens no terminal:**

| Nível | Formato | Exemplo |
|---|---|---|
| Sucesso | `✓ [mensagem]` | `✓ Skills empresariais validadas` |
| Progresso | `→ [ação]... OK` | `→ Instalando cybersecurity-analyst... OK` |
| Aviso | `⚠ [mensagem]` | `⚠ Não foi possível verificar skills (erro de rede)` |
| Erro | `✗ [mensagem]` | `✗ Skills empresariais obrigatórias não encontradas` |

**Lock file como registro:**

O `enterprise-skills-lock.json` serve como log persistente da última validação (`lastChecked`) e estado das skills instaladas, permitindo auditoria.

## Considerações Técnicas

### Decisões Principais

| Decisão | Justificativa | Alternativa rejeitada |
|---|---|---|
| **Operações git padrão** em vez de API de provedor | Agnóstico de provedor; funciona com GitHub, Azure DevOps, GitLab, Bitbucket; não requer CLI específica (`gh`, `az`); usa credenciais git já configuradas | `gh api` — acoplaria a solução ao GitHub, exigindo reescrita ao migrar de provedor |
| **Shallow clone com cache local** | `--depth 1` minimiza tráfego; cache em `.claude/.enterprise-skills-cache/` evita re-clone a cada invocação; `git pull` atualiza incrementalmente | Clone completo — baixaria histórico desnecessário; download direto por arquivo — exigiria API específica de cada provedor |
| **Instruções Markdown** em vez de script TS | Zero dependência de build; funciona em qualquer projeto que use Claude Code; consistente com a arquitetura existente de skills | Script TypeScript — adicionaria complexidade de build e dependência de bun em projetos que podem não usá-lo |
| **Bloco compartilhado** em arquivo separado | Evita duplicação; atualização centralizada; uma correção aplica a todas as skills | Copiar instruções em cada SKILL.md — manutenção impossível com 11 arquivos |
| **Lock file commitado** no repo | Garante consistência entre devs; mudanças visíveis no git diff; auditável | Lock no .gitignore — cada dev teria versões diferentes, impossível garantir conformidade |
| **Remoção automática** de skills obsoletas | Mantém o ambiente limpo; segue o princípio de que o repo empresarial é fonte de verdade | Apenas avisar — acumularia skills obsoletas e geraria confusão |
| **Fallback offline** quando skills já instaladas | Não bloquear o dev por problemas temporários de rede; o lock local é confiável | Bloquear sempre — impediria trabalho offline completamente |

### Riscos Conhecidos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Credenciais git não configuradas para o repo empresarial | Média | Alto (bloqueia toda validação) | Mensagem de erro clara com instruções de configuração de acesso git (SSH key ou credential helper) |
| Migração de provedor git (ex: GitHub → Azure DevOps) | Média | Baixo | Apenas alterar `remote.url` e `remote.provider` no lock file; lógica de validação é agnóstica |
| Repositório empresarial privado sem acesso | Baixa | Alto | Verificar acesso no bootstrap e alertar imediatamente |
| Skills com muitos arquivos grandes | Baixa | Médio (lentidão) | Shallow clone (`--depth 1`) minimiza download; cache local evita re-clone |
| Symlinks não suportados em Windows | Média | Médio | O kspec é especificado para macOS/Linux; documentar limitação |
| Race condition em execuções paralelas | Baixa | Baixo | O lock file é atualizado atomicamente; `kspec-implement-all-tasks` serializa a validação |
| Provedor git com autenticação diferenciada (ex: Azure DevOps PAT) | Baixa | Médio | A solução usa `git clone` padrão — qualquer mecanismo de autenticação suportado pelo git funciona (SSH, HTTPS + credential helper, PAT) |

### Conformidade com Skills Padrões

Esta funcionalidade não envolve código frontend ou backend do produto — é infraestrutura de tooling. Não há skills de domínio aplicáveis da tabela "Stack e skills recomendadas" do CLAUDE.md.

Skills kspec aplicáveis ao fluxo de desenvolvimento desta feature:
- `kspec-prd` — PRD já criado
- `kspec-techspec` — Este documento
- `kspec-tasks` — Próximo passo
- `kspec-implement-task` — Implementação

### Arquivos relevantes e dependentes

**Arquivos novos:**
- `.claude/validation/enterprise-skills-check.md` — Bloco de validação compartilhado
- `enterprise-skills-lock.json` — Lock file local (raiz do projeto)

**Arquivos modificados:**
- `.claude/skills/kspec-bootstrap/SKILL.md`
- `.claude/skills/kspec-prd/SKILL.md`
- `.claude/skills/kspec-techspec/SKILL.md`
- `.claude/skills/kspec-tasks/SKILL.md`
- `.claude/skills/kspec-implement-task/SKILL.md`
- `.claude/skills/kspec-implement-all-tasks/SKILL.md`
- `.claude/skills/kspec-qa/SKILL.md`
- `.claude/skills/kspec-bugfix/SKILL.md`
- `.claude/agents/kspec-task-runner/AGENT.md`
- `.claude/agents/kspec-review-runner/AGENT.md`
- `.claude/agents/kspec-qa-runner/AGENT.md`

**Arquivos ignorados (`.gitignore`):**
- `.claude/.enterprise-skills-cache/` — Clone shallow do repositório empresarial (cache local, não commitado)

**Arquivos de referência (leitura apenas):**
- Repositório empresarial `/skills-lock.json` (acessado via git clone)
- Repositório empresarial `/.agents/skills/*/` (acessado via git clone)
