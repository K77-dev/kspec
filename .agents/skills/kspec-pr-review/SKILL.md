---
name: kspec-pr-review
version: 1.0.0
description: Valida semanticamente se a implementação está aderente ao PRD, TechSpec e tasks, gera relatório de alinhamento (score, gaps, riscos, cobertura de testes e recomendação APPROVED / APPROVED WITH WARNINGS / REJECTED) e preenche o corpo do PR com o template oficial. Use antes de abrir ou aprovar um Pull Request, após implementação ou quando o usuário pedir revisão semântica de entrega contra a spec ('AI Spec Intelligence').
argument-hint: "<slug-funcionalidade> (ex: 001-prd-auth)"
---

> Ao iniciar a execução desta skill, exiba: **kspec v1.0.0 — kspec-pr-review**

## Funcionalidade

O slug da funcionalidade é: **$ARGUMENTS**

Se `$ARGUMENTS` estiver vazio, peça ao usuário para informar o slug (ex: `/kspec-pr-review 001-prd-auth`) e não prossiga até receber.

**Contexto obrigatório de trabalho:** `spec/tasks/$ARGUMENTS/` é a pasta da funcionalidade (contém `prd.md`, `techspec.md`, tasks individuais e `tasks.md` quando existir).

### 0. Validação de Skills Empresariais (obrigatório)

**Pré-requisito — arquivo de validação presente:**

```bash
test -f .agents/validation/enterprise-skills-check.md && [ "$(wc -l < .agents/validation/enterprise-skills-check.md)" -ge 100 ]
```

Se faltar ou estiver truncado:

`✗ Arquivo de validação ausente/corrompido. Execute 'npx @k77-dev/kspec install' na raiz do projeto e tente novamente.`

Bloqueie a execução. NÃO tente baixar via `gh api` ou `git clone`.

**Validação propriamente dita:** siga `@.agents/validation/enterprise-skills-check.md`. NÃO prossiga para o próximo passo se a validação bloquear a execução.

---

## Objetivo da Skill

Validar semanticamente se a implementação realizada está aderente ao que foi especificado no PRD, Tech Spec e Tasks, gerando um relatório de alinhamento semântico antes da abertura/aprovação do Pull Request.

A skill funciona como uma camada de verificação da entrega.

---

## Fluxo Esperado

### 1. Ler obrigatoriamente os arquivos

- `@spec/tasks/$ARGUMENTS/prd.md`
- `@spec/tasks/$ARGUMENTS/techspec.md`
- Todas as task files da pasta atual: `@spec/tasks/$ARGUMENTS/*_task.md` (ou equivalente definido pelo projeto; incluir também `@spec/tasks/$ARGUMENTS/tasks.md` quando existir como índice)

### 2. Ler as alterações realizadas no projeto

- **`git diff`** (working tree vs `HEAD`, e quando relevante **`git diff` contra a branch base** do PR, ex. `origin/main…HEAD`)
- Lista de **arquivos modificados/adicionados/removidos**
- Identificar **testes criados ou modificados** (por caminho e por tipo inferido: unitário, integração, E2E)

### 3. Identificar

- Requisitos **atendidos**
- Requisitos **parcialmente atendidos**
- Requisitos **não atendidos**
- **Implementações fora do escopo** (código/comportamento sem base em PRD/Tech Spec/Tasks ou além do combinado nas tasks marcadas como concluídas)
- **Riscos técnicos relevantes** (breaking changes, migrações, segurança, performance, dependências)
- **Ausência de testes** (por requisito ou área funcional que a spec explicita ou implicitamente exige cobertura)
- **Divergências entre spec e implementação**
- **Alterações sem rastreabilidade** (mudanças no diff sem menção correlata em PRD/Tech Spec/tasks/reviews/task descriptions)
- **Possível scope creep** (expansão de superfície, novas APIs, features ou refactors não amarrados a requisitos/tasks)

### 4. Gerar relatório estruturado

Persistir em **`spec/tasks/$ARGUMENTS/alignment-report.md`** (sobrescrever se já existir de execuções anteriores desta skill no mesmo slug).

O relatório deve conter obrigatoriamente:

- **Alignment Score (%)** — ver seção «Cálculo do Alignment Score» abaixo; exibir também a **fórmula e os números** usados (ex.: totais de requisitos rastreados, pesos parciais, penalidades), para auditabilidade
- **Requisitos atendidos** — com vínculo a IDs/seções da spec quando existirem
- **Gaps encontrados** — incluindo parciais e não atendidos, com evidência (arquivo/comportamento) e impacto
- **Funcionalidades fora do escopo** — lista objetiva do que aparece na implementação/diff sem âncora na spec
- **Riscos detectados**
- **Cobertura de testes** — o que há de evidência vs. lacunas por requisito crítico; distinguir inferência («não foram encontrados testes para …») de confirmação explícita
- **Recomendação final** (uma apenas):
  - `APPROVED`
  - `APPROVED WITH WARNINGS`
  - `REJECTED`

Depois da escrita do arquivo, apresentar ao usuário um **resumo executivo** (poucas frases), o **score**, a **recomendação** e o caminho **`alignment-report.md`**.

### 5. Gerar automaticamente o Pull Request

Gerar automaticamente o conteúdo final do Pull Request utilizando o template oficial de PR da spec:

`@.agents/templates/pr-template.md`

A skill deve:

- Preencher automaticamente todas as seções do template com base na análise realizada
- Utilizar apenas evidências verificadas durante a execução
- Referenciar o arquivo `pr-review.md`
- Adicionar o Alignment Score e a Recomendação Final no corpo do PR
- Utilizar `N/A — [motivo]` quando alguma seção não for aplicável

A skill NÃO deve redefinir ou duplicar a estrutura do template oficial de PR dentro desta skill.

---

## Regras Importantes

- Priorizar **precisão** e **explicabilidade** — toda classificação (atendido/parcial/não/traceability) deve carregar **justificativa** referenciando spec ou diff
- **Nunca aprovar** (`APPROVED` ou `APPROVED WITH WARNINGS` que ocultem bloqueadores) sem verificar aderência aos requisitos: se a verificação for impossível (spec ausente, diff inacessível), **abortar com falha explícita** e recomendação `REJECTED` ou não emitir recomendação positiva até corrigir o contexto
- Identificar **alterações sem rastreabilidade** quando não houver caminho dedutível até PRD/Tech Spec/Task
- Alertar quando houver **requisitos sem cobertura por testes** (especialmente fluxos críticos, regressão financeira/autorização/dados sensíveis se presentes na spec)
- Detectar **possível scope creep** quando o diff aumentar comportamento público ou superfície de API sem âncora
- Linguagem **objetiva e técnica**
- **Falhar a validação** quando houver **inconsistências críticas**: emitir relatório completo mesmo assim, **`REJECTED`** na recomendação final, **Alignment Score ≤ 69%** ou explícito «validação falhou» na seção de recomendações; detalhar as inconsistências sob «Gaps» e «Riscos»

Critérios guia para **crítico** (ajustar à severidade declarada na spec):

- Requisito de negócio ou não-funcional **explícito** não implementado ou contradito pelo código/comportamento
- Ausência agregada de testes onde a spec obriga cenários objetivos ou onde o risco de regressão é alto **e** há mudanças substanciais no núcleo do fluxo
- Implementação que viola segurança/integridade **segundo Tech Spec**, sem mitigação documentada

---

## Objetivo Estratégico

Esta skill integra a iniciativa **«AI Spec Intelligence»**: validar semanticamente se o software entregue corresponde ao que foi especificado.

---

### Cálculo do Alignment Score (auditável)

1. Extrair lista **R** de itens rastreados (requisitos funcionais/não funcionais nas seções típicas + critérios de aceite nas tasks que o PR cobre).
2. Classificar cada item em **Atendido (1 ponto)** | **Parcial (0,5)** | **Não atendido (0)**.
3. **Score base** = `round(100 * (soma dos pontos) / |R|)`. Se `|R|=0`, não inventar lista: declarar «rastreamento não estruturado» — Score = `N/A` e recomendação máxima `APPROVED WITH WARNINGS`.
4. **Penalidades** (explícitas no relatório):
   - **−5 a −15 pontos** por implementação relevante **fora de escopo** sem justificativa na spec (-15 se alterar comportamento público/API)
   - **−5 a −20 pontos** por **requisito crítico** sem evidência de teste quando testes são claramente esperados
   - **−10 a −25 pontos** por **alto risco técnico** não refletido na spec ou sem compensação descrita nas tasks
5. Limitar resultado a **`[0, 100]`** após penalidades.

**Mapeamento Score → recomendação (padrão):**

| Faixa | Recomendação |
| --- | --- |
| Sem inconsistências críticas e lacunas apenas menores ou com plano/mitigação aceitável | `APPROVED` (tipicamente **≥ 90%** e sem gap crítico) |
| Gaps pontuais, riscos contidos, cobertura de testes incompleta em âmbito não crítico ou scope creep menor documentado | `APPROVED WITH WARNINGS` (tipicamente **70–89%** ou **score alto com alertas materiais**) |
| Inconsistência crítica, aderência grosseira à spec não demonstrada ou score após penalidades **< 70%** | `REJECTED` |

Qualquer inconsistência que dispare a regra de **«falhar a validação»** force **`REJECTED`**, mesmo que o score numérico fique alto (documentar contradição na seção de gaps).

---

## Regras gerais (orquestração)

- Para escolhas ao usuário, preferir ferramentas interativas disponíveis na plataforma; se não houver, texto com opções numeradas
- Não usar heurísticas opacas para «parece ok»: cada conclusão material deve poder ser conferida contra **trecho da spec** ou **trecho do diff**
- Ao final, se `--no-verify`/skip hooks forem mencionados em contexto de PR, registre como **warning de processo**, não substitua verificação de aderência
