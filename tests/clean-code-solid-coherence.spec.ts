import { readFileSync, existsSync, lstatSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ruleToMdc } from "../src/lib/install.js";
import {
  parseAgentFile,
  renderAgentToml,
  resolveSandboxMode,
} from "../src/lib/agent-toml.js";

const ROOT = resolve(import.meta.dirname, "..");
const CODE_STANDARDS = resolve(ROOT, ".agents/rules/code-standards.md");
const REVIEW_RUNNER = resolve(ROOT, ".agents/agents/kspec-review-runner/AGENT.md");
const TASK_RUNNER = resolve(ROOT, ".agents/agents/kspec-task-runner/AGENT.md");
const IMPLEMENT_SKILL = resolve(ROOT, ".agents/skills/kspec-implement/SKILL.md");

function readCodeStandards(): string {
  expect(existsSync(CODE_STANDARDS), "code-standards.md must exist").toBe(true);
  return readFileSync(CODE_STANDARDS, "utf-8");
}

function countWords(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#|*`\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function countNumberedSections(content: string): number {
  const matches = content.match(/^## \d+\./gm);
  return matches?.length ?? 0;
}

describe("code-standards.md", () => {
  const content = readCodeStandards();

  it("contains frontmatter with universal description", () => {
    expect(content).toMatch(/^---\n/);
    expect(content).toContain(
      "description: Clean Code, SOLID e limites mensuráveis — rule universal sempre aplicável"
    );
  });

  it("contains at least 15 numbered sections covering Clean Code and SOLID", () => {
    const sectionCount = countNumberedSections(content);
    expect(sectionCount).toBeGreaterThanOrEqual(15);

    const requiredSections = [
      "## 1. Propósito e Escopo",
      "## 2. Nomenclatura Expressiva",
      "## 3. Funções Pequenas e Responsabilidade Única",
      "## 4. Early Returns",
      "## 5. DRY",
      "## 6. Comentários",
      "## 7. Tratamento Explícito de Erros",
      "## 8. Magic Numbers e Parâmetros",
      "## 9. SRP",
      "## 10. OCP",
      "## 11. LSP",
      "## 12. ISP",
      "## 13. DIP",
      "## 14. Limites Mensuráveis",
      "## 15. Classificação de Violações",
      "## 16. Exemplos TypeScript",
      "## 17. Exemplos Java",
      "## 18. Relação com Rules de Stack",
    ];

    for (const section of requiredSections) {
      expect(content, `missing section: ${section}`).toContain(section);
    }
  });

  it("documents Clean Code principles (RF-001.1)", () => {
    expect(content).toContain("Nomenclatura Expressiva");
    expect(content).toContain("Early Returns");
    expect(content).toContain("DRY");
    expect(content).toContain("Comentários");
    expect(content).toContain("Tratamento Explícito de Erros");
    expect(content).toContain("Magic Numbers");
  });

  it("documents all five SOLID principles with definition, signals and correction (RF-001.2)", () => {
    for (const principle of ["SRP", "OCP", "LSP", "ISP", "DIP"]) {
      expect(content).toContain(principle);
      expect(content).toContain("Definição");
      expect(content).toContain("Sinais de violação");
      expect(content).toContain("Correção");
    }
  });

  it("contains measurable limits table with required values (RF-001.3)", () => {
    expect(content).toContain("## 14. Limites Mensuráveis");
    expect(content).toContain("| Métrica | Limite | Severidade padrão | Como verificar (agent) |");

    const limits = ["50", "10", "4", "3", "300", "15", "6"];
    for (const value of limits) {
      expect(content, `limit table must reference ${value}`).toContain(value);
    }
  });

  it("classifies God Class as aviso, not bloqueante (RF-001.3 / RF-001.5)", () => {
    expect(content).toContain("God Class");
    expect(content).toMatch(/\*\*Aviso\*\*/);
    expect(content).toContain("**Bloqueante**");
    expect(content).toContain("**Sugestão**");
    expect(content).toContain("REPROVADO");
    expect(content).toContain("APROVADO COM RESSALVAS");
  });

  it("contains TypeScript and Java examples for SRP, DIP, nomenclatura and long functions (RF-001.4)", () => {
    const tsSection = content.slice(
      content.indexOf("## 16. Exemplos TypeScript"),
      content.indexOf("## 17. Exemplos Java")
    );
    const javaSection = content.slice(
      content.indexOf("## 17. Exemplos Java"),
      content.indexOf("## 18. Relação com Rules de Stack")
    );

    for (const section of [tsSection, javaSection]) {
      expect(section).toContain("### Nomenclatura");
      expect(section).toContain("### Funções longas");
      expect(section).toContain("### SRP");
      expect(section).toContain("### DIP");
      expect(section).toContain("// ❌");
      expect(section).toContain("// ✅");
    }

    expect(tsSection).toContain("```typescript");
    expect(javaSection).toContain("```java");
  });

  it("remains technology-agnostic with stack rules in section 18 (RF-001.6)", () => {
    expect(content).toContain("## 18. Relação com Rules de Stack");
    expect(content).toContain("independente de stack");
    expect(content).toContain("react.md");
    expect(content).toContain("spring-boot.md");
    expect(content).toContain("todas as linguagens");
  });

  it("stays within 2.000 words (RF-001 / techspec)", () => {
    const wordCount = countWords(content);
    expect(wordCount).toBeLessThanOrEqual(2000);
    expect(wordCount).toBeGreaterThan(500);
  });
});

const CLAUDE_TEMPLATE = resolve(ROOT, ".agents/templates/claude-md-template.md");
const CURSOR_TEMPLATE = resolve(ROOT, ".agents/templates/cursor-md-template.md");
const BOOTSTRAP_SKILL = resolve(ROOT, ".agents/skills/kspec-bootstrap/SKILL.md");

function readFile(path: string): string {
  expect(existsSync(path), `${path} must exist`).toBe(true);
  return readFileSync(path, "utf-8");
}

describe("templates", () => {
  it("claude-md-template lists code-standards.md as mandatory core rule (RF-004.1)", () => {
    const content = readFile(CLAUDE_TEMPLATE);

    expect(content).toContain("### Rules — Padrões de Código");
    expect(content).toContain("`code-standards.md`");
    expect(content).toContain("Clean Code, SOLID, limites mensuráveis");
    expect(content).toMatch(/obrigat[oó]ri/i);
    expect(content).toMatch(/inegoci[aá]vel/i);
    expect(content).toMatch(/brownfield/i);
  });

  it("cursor-md-template lists code-standards with alwaysApply: true (RF-004.2)", () => {
    const content = readFile(CURSOR_TEMPLATE);

    expect(content).toContain("## Rules — Padrões de Código");
    expect(content).toContain("code-standards.md");
    expect(content).toContain("Clean Code, SOLID, limites mensuráveis");
    expect(content).toContain("alwaysApply: true");
    expect(content).toMatch(/inegoci[aá]vel/i);
    expect(content).toMatch(/brownfield/i);
  });

  it("agents-md-template does not exist — Codex inherits rules section from claude-md-template (step 4B)", () => {
    const agentsTemplate = resolve(ROOT, ".agents/templates/agents-md-template.md");
    expect(existsSync(agentsTemplate)).toBe(false);

    const bootstrap = readFile(BOOTSTRAP_SKILL);
    expect(bootstrap).toContain("### 4B. Gerar AGENTS.bootstrap.md");
    expect(bootstrap).toMatch(/Rules — Padrões de Código/i);
    expect(bootstrap).toContain("code-standards.md");
  });
});

describe("kspec-bootstrap", () => {
  const content = readFile(BOOTSTRAP_SKILL);

  it("validates code-standards.md as mandatory core rule in step 5.4 (RF-004.1)", () => {
    const step54 = content.slice(
      content.indexOf("**5.4. Rules do core kspec"),
      content.indexOf("**5.5. Remover rules")
    );

    expect(step54).toContain("code-standards.md");
    expect(step54).toContain(".agents/rules/code-standards.md");
    expect(step54).toContain("Clean Code, SOLID, limites mensuráveis");
    expect(step54).toMatch(/obrigat[oó]ri/i);
    expect(step54).toMatch(/BLOQUEIE o bootstrap/i);
    expect(step54).toContain("alwaysApply: true");
  });

  it("brownfield step 5.6 keeps Clean Code and SOLID non-negotiable (RF-004.3)", () => {
    const step56 = content.slice(
      content.indexOf("**5.6. Adaptar conteúdo"),
      content.indexOf("**5.7. Ajustar `paths:`")
    );

    expect(step56).toContain("code-standards.md");
    expect(step56).toMatch(/inegoci[aá]ve/i);
    expect(step56).toMatch(/Clean Code e SOLID/i);
    expect(step56).toMatch(/apenas conven[cç][oõ]es de estilo/i);
  });

  it("final report step 8 confirms code-standards.md validation (RF-004.4)", () => {
    const step8 = content.slice(
      content.indexOf("### 8. Relatório Final"),
      content.indexOf("## Checklist de Qualidade")
    );

    expect(step8).toContain("code-standards.md");
    expect(step8).toContain("Clean Code, SOLID, limites mensuráveis");
    expect(step8).toContain("alwaysApply: true");
    expect(step8).toMatch(/brownfield/i);
  });

  it("quality checklist includes code-standards validation", () => {
    const checklist = content.slice(content.indexOf("## Checklist de Qualidade"));

    expect(checklist).toContain("code-standards.md");
    expect(checklist).toMatch(/passo 5\.4/i);
  });
});

describe("kspec-review-runner", () => {
  const content = (() => {
    expect(existsSync(REVIEW_RUNNER), "kspec-review-runner/AGENT.md must exist").toBe(true);
    return readFileSync(REVIEW_RUNNER, "utf-8");
  })();

  it("references code-standards.md as mandatory rule in documentation analysis (RF-002.1)", () => {
    const step1 = content.slice(
      content.indexOf("### 1. Análise de Documentação"),
      content.indexOf("### 2. Análise das Mudanças")
    );

    expect(step1).toContain("code-standards.md");
    expect(step1).toMatch(/obrigat[oó]riamente/i);
    expect(step1).toMatch(/obrigat[oó]ria/i);
  });

  it("expands Step 8 with verifiable SOLID checklist for all five principles (RF-002.1 / RF-002.2)", () => {
    const step8 = content.slice(
      content.indexOf("### 8. Análise de Qualidade de Código"),
      content.indexOf("### 9. Relatório de Code Review")
    );

    expect(step8).toContain("code-standards.md");
    expect(step8).toContain("SOLID — checklist verificável");

    for (const principle of ["SRP", "OCP", "LSP", "ISP", "DIP"]) {
      expect(step8, `Step 8 must cover ${principle}`).toContain(`**${principle}**`);
    }

    expect(step8).toContain("Clean Code — checklist verificável");
    expect(step8).toContain("Nomenclatura");
    expect(step8).toContain("DRY");
    expect(step8).toContain("Limites mensuráveis");
  });

  it("documents blocking criteria in critical block separate from warnings (RF-002.2)", () => {
    const step8 = content.slice(
      content.indexOf("### 8. Análise de Qualidade de Código"),
      content.indexOf("### 9. Relatório de Code Review")
    );

    expect(step8).toContain("<critical>");
    expect(step8).toContain("Critérios bloqueantes");
    expect(step8).toContain("Critérios de aviso");

    const criticalBlock = step8.slice(
      step8.indexOf("<critical>"),
      step8.indexOf("</critical>")
    );

    expect(criticalBlock).toContain("50 linhas");
    expect(criticalBlock).toMatch(/complexidade/i);
    expect(criticalBlock).toContain("SRP");
    expect(criticalBlock).toContain("DIP");
    expect(criticalBlock).toContain("6 linhas");

    const avisoSection = step8.slice(step8.indexOf("Critérios de aviso"));
    expect(avisoSection).toContain("God Class");
    expect(avisoSection).toContain("4 parâmetros");
    expect(avisoSection).toContain("Aninhamento");
  });

  it("defines Conformidade Clean Code/SOLID report section with item × status table (RF-002.3)", () => {
    const step9 = content.slice(content.indexOf("### 9. Relatório de Code Review"));

    expect(step9).toContain("## Conformidade Clean Code/SOLID");
    expect(step9).toContain("| Item | Status | Severidade | Referência § | Observações |");

    for (const row of ["Nomenclatura", "SRP", "DIP", "Complexidade ciclomática", "God Class"]) {
      expect(step9, `report table must include row for ${row}`).toContain(row);
    }
  });

  it("instructs citing code-standards.md section references in violations (RF-002.3)", () => {
    expect(content).toContain("code-standards.md §");
    expect(content).toMatch(/(cite|citar).*code-standards\.md §/i);
    expect(content).toContain("§ Limites Mensuráveis");
    expect(content).toContain("§ SRP");
    expect(content).toContain("§ DIP");
  });

  it("maintains compatibility with existing security, TechSpec and test checks (RF-002.4)", () => {
    expect(content).toContain("### 4. Verificação de Segurança");
    expect(content).toContain("### 5. Verificação de Aderência à TechSpec");
    expect(content).toContain("### 7. Execução dos Testes");
    expect(content).toContain("Security permanece no Step 4");
    expect(content).toContain("aderência à TechSpec no Step 5");
    expect(content).toContain("testes no Step 7");
  });

  it("includes Clean Code/SOLID blocking criteria in REPROVADO approval criteria", () => {
    const approval = content.slice(content.indexOf("## Critérios de Aprovação"));

    expect(approval).toContain("critério bloqueante de Clean Code/SOLID");
    expect(approval).toContain("função > 50 linhas");
    expect(approval).toContain("complexidade > 10");
    expect(approval).toContain("duplicação > 6 linhas");
  });
});

describe("kspec-task-runner", () => {
  const content = (() => {
    expect(existsSync(TASK_RUNNER), "kspec-task-runner/AGENT.md must exist").toBe(true);
    return readFileSync(TASK_RUNNER, "utf-8");
  })();

  it("reads code-standards.md in task analysis step and includes principles in summary (RF-003.1)", () => {
    const step2 = content.slice(
      content.indexOf("### 2. Análise da Tarefa"),
      content.indexOf("### 3. Resumo da Tarefa")
    );
    const step3 = content.slice(
      content.indexOf("### 3. Resumo da Tarefa"),
      content.indexOf("### 4. Plano de Abordagem")
    );

    expect(step2).toContain("code-standards.md");
    expect(step2).toMatch(/obrigat[oó]riamente/i);
    expect(step2).toMatch(/50\/10\/4|50 linhas|complexidade 10|4 parâmetros/i);
    expect(step3).toContain("Princípios Clean Code/SOLID aplicáveis");
  });

  it("defines step 7.5 Verificação Clean Code/SOLID before test verification (RF-003.2)", () => {
    const step75Index = content.indexOf("### 7.5. Verificação Clean Code/SOLID");
    const step7Index = content.indexOf("### 7. Verificação");

    expect(step75Index).toBeGreaterThan(-1);
    expect(step7Index).toBeGreaterThan(-1);
    expect(step75Index).toBeLessThan(step7Index);
    expect(content).toContain("Verificação Clean Code/SOLID");
  });

  it("documents auto-verification checklist with measurable limits 50/10/4 (RF-003.2)", () => {
    const step75 = content.slice(
      content.indexOf("### 7.5. Verificação Clean Code/SOLID"),
      content.indexOf("### 7. Verificação")
    );

    expect(step75).toContain("Checklist de auto-verificação");
    expect(step75).toContain("Nomenclatura");
    expect(step75).toContain("SRP");
    expect(step75).toContain("Tratamento de erros");
    expect(step75).toContain("DRY");
    expect(step75).toContain("Limites mensuráveis");

    expect(step75).toContain("≤ 50");
    expect(step75).toContain("≤ 10");
    expect(step75).toContain("≤ 4");
    expect(step75).toMatch(/complexidade cicl[oô]mática/i);
  });

  it("instructs fixing violations before delivery, not delegating to review (RF-003.4)", () => {
    const step75 = content.slice(
      content.indexOf("### 7.5. Verificação Clean Code/SOLID"),
      content.indexOf("### 7. Verificação")
    );

    expect(step75).toContain("<critical>");
    expect(step75).toMatch(/corrigidas nesta etapa/i);
    expect(step75).toMatch(/não delegar/i);
    expect(step75).toContain("kspec-review-runner");
  });

  it("aligns blocking criteria with review-runner (RF-003.2 / 3.5)", () => {
    const step75 = content.slice(
      content.indexOf("### 7.5. Verificação Clean Code/SOLID"),
      content.indexOf("### 7. Verificação")
    );

    const criticalBlock = step75.slice(
      step75.indexOf("<critical>"),
      step75.indexOf("</critical>")
    );

    expect(criticalBlock).toContain("50 linhas");
    expect(criticalBlock).toMatch(/complexidade/i);
    expect(criticalBlock).toContain("SRP");
    expect(criticalBlock).toContain("DIP");
    expect(criticalBlock).toContain("6 linhas");
    expect(step75).toContain("code-standards.md §");
  });
});

describe("kspec-implement", () => {
  const content = (() => {
    expect(existsSync(IMPLEMENT_SKILL), "kspec-implement/SKILL.md must exist").toBe(true);
    return readFileSync(IMPLEMENT_SKILL, "utf-8");
  })();

  it("declares Clean Code/SOLID auto-verification as mandatory completion gate (RF-003.3)", () => {
    const rules = content.slice(
      content.indexOf("## Regras"),
      content.indexOf("## Funcionalidade")
    );

    expect(rules).toMatch(/gate obrigat[oó]rio/i);
    expect(rules).toMatch(/auto-verifica[cç][aã]o Clean Code\/SOLID/i);
    expect(rules).toContain("etapa 7.5");
    expect(rules).toMatch(/nenhuma task [eé] considerada conclu[ií]da/i);
  });

  it("requires step 7.5 confirmation before delegating to review-runner", () => {
    const parallel = content.slice(
      content.indexOf("#### Modo Paralelo"),
      content.indexOf("#### Modo Sequencial")
    );
    const sequential = content.slice(
      content.indexOf("#### Modo Sequencial"),
      content.indexOf("#### Formato do Diagnóstico")
    );

    expect(parallel).toContain("7.5");
    expect(parallel).toMatch(/auto-verifica[cç][aã]o Clean Code\/SOLID/i);
    expect(sequential).toContain("7.5");
    expect(sequential).toMatch(/auto-verifica[cç][aã]o Clean Code\/SOLID/i);
  });

  it("includes auto-verification in quality checklist", () => {
    const checklist = content.slice(content.indexOf("## Checklist de Qualidade"));

    expect(checklist).toMatch(/auto-verifica[cç][aã]o Clean Code\/SOLID/i);
    expect(checklist).toContain("7.5");
    expect(checklist).toMatch(/antes do review/i);
  });
});

const CURSOR_MDC = resolve(ROOT, ".cursor/rules/code-standards.mdc");
const CLAUDE_RULES = resolve(ROOT, ".claude/rules");
const CODEX_AGENTS = resolve(ROOT, ".codex/agents");

const CLEAN_CODE_AGENTS = ["kspec-task-runner", "kspec-review-runner"] as const;

function resolveSymlinkTarget(linkPath: string): string {
  const target = readlinkSync(linkPath);
  return resolve(linkPath, "..", target);
}

function expectAgentSymlink(platformDir: string, agent: string): void {
  const linkPath = resolve(platformDir, agent);
  expect(existsSync(linkPath), `${linkPath} must exist`).toBe(true);
  expect(lstatSync(linkPath).isSymbolicLink(), `${linkPath} must be a symlink`).toBe(true);

  const resolved = resolveSymlinkTarget(linkPath);
  const expected = resolve(ROOT, ".agents/agents", agent);
  expect(resolved).toBe(expected);
}

describe("platform parity (RF-005)", () => {
  it("ruleToMdc propagates expanded code-standards with alwaysApply true (RF-005.1 / RF-005.2)", () => {
    const source = readCodeStandards();
    const mdc = ruleToMdc("code-standards", source);

    expect(mdc).toContain("alwaysApply: true");
    expect(mdc).not.toContain("globs:");
    expect(mdc).toContain("## 14. Limites Mensuráveis");
    expect(mdc).toContain("## 15. Classificação de Violações");
    expect(mdc).toContain("SRP");
    expect(mdc).toContain("≤ 50");
    expect(mdc).toContain("Clean Code, SOLID e limites mensuráveis");
  });

  it("committed .cursor/rules/code-standards.mdc matches ruleToMdc output (RF-005.1)", () => {
    const source = readCodeStandards();
    const expected = ruleToMdc("code-standards", source);
    const committed = readFile(CURSOR_MDC);

    expect(committed).toBe(expected);
    expect(committed).toContain("alwaysApply: true");
  });

  it.skipIf(process.platform === "win32")(
    "clean-code agents symlink from .claude/agents/ to .agents/agents/ (RF-005.3)",
    () => {
      for (const agent of CLEAN_CODE_AGENTS) {
        expectAgentSymlink(resolve(ROOT, ".claude/agents"), agent);
      }
    }
  );

  it.skipIf(process.platform === "win32")(
    "clean-code agents symlink from .cursor/agents/ to .agents/agents/ (RF-005.3)",
    () => {
      for (const agent of CLEAN_CODE_AGENTS) {
        expectAgentSymlink(resolve(ROOT, ".cursor/agents"), agent);
      }
    }
  );

  it.skipIf(process.platform === "win32")(
    ".claude/rules symlinks to .agents/rules/ for code-standards discovery (RF-005.1)",
    () => {
      expect(existsSync(CLAUDE_RULES)).toBe(true);
      expect(lstatSync(CLAUDE_RULES).isSymbolicLink()).toBe(true);

      const resolved = resolveSymlinkTarget(CLAUDE_RULES);
      expect(resolved).toBe(resolve(ROOT, ".agents/rules"));
      expect(existsSync(resolve(CLAUDE_RULES, "code-standards.md"))).toBe(true);
    }
  );

  it("codex TOML artifacts match agent-toml pipeline output for task and review runners (RF-005.3)", () => {
    for (const agent of CLEAN_CODE_AGENTS) {
      const agentPath = resolve(ROOT, ".agents/agents", agent, "AGENT.md");
      const doc = parseAgentFile(agentPath);
      const expected = renderAgentToml(doc, resolveSandboxMode(agent));
      const committed = readFile(resolve(CODEX_AGENTS, `${agent}.toml`));

      expect(committed).toBe(expected);
    }
  });

  it("codex TOML for task-runner includes Clean Code step 7.5 from AGENT.md (RF-005.3)", () => {
    const toml = readFile(resolve(CODEX_AGENTS, "kspec-task-runner.toml"));

    expect(toml).toContain("### 7.5. Verificação Clean Code/SOLID");
    expect(toml).toContain("code-standards.md");
    expect(toml).toContain("≤ 50");
    expect(toml).toMatch(/corrigidas nesta etapa/i);
    expect(toml).toContain('sandbox_mode = "workspace-write"');
  });

  it("codex TOML for review-runner includes expanded Step 8 and report section (RF-005.3)", () => {
    const toml = readFile(resolve(CODEX_AGENTS, "kspec-review-runner.toml"));

    expect(toml).toContain("SOLID — checklist verificável");
    expect(toml).toContain("## Conformidade Clean Code/SOLID");
    expect(toml).toContain("Critérios bloqueantes");
    expect(toml).toContain("code-standards.md §");
    expect(toml).toContain('sandbox_mode = "read-only"');
  });
});
