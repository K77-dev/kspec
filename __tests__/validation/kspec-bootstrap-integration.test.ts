import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

describe("kspec-bootstrap/SKILL.md - Enterprise Skills Validation", () => {
  const filePath = resolve(ROOT, ".claude/skills/kspec-bootstrap/SKILL.md");
  let content: string;

  beforeAll(() => {
    content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  });

  it("should exist at .claude/skills/kspec-bootstrap/SKILL.md", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("should reference @.claude/validation/enterprise-skills-check.md", () => {
    expect(content).toContain(
      "@.claude/validation/enterprise-skills-check.md"
    );
  });

  it("should contain a validation step titled 'Validação de Skills Empresariais'", () => {
    expect(content).toContain("Validação de Skills Empresariais");
    expect(content).toContain("Obrigatório");
  });

  it("should explicitly prohibit fallback offline", () => {
    expect(content).toContain("NÃO permitir fallback offline");
  });

  it("should instruct to block bootstrap on failure", () => {
    expect(content).toContain("bloquear o bootstrap");
  });

  it("should instruct detailed messages for each skill", () => {
    expect(content).toContain(
      "Exibir mensagem detalhada para cada skill instalada/atualizada"
    );
  });

  it("should instruct not to proceed if validation blocks", () => {
    expect(content).toContain(
      "NÃO prossiga para o próximo passo se a validação bloquear a execução"
    );
  });
});

describe("kspec-bootstrap/SKILL.md - Step Order", () => {
  const filePath = resolve(ROOT, ".claude/skills/kspec-bootstrap/SKILL.md");
  let content: string;

  beforeAll(() => {
    content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  });

  it("should have validation step (1) after configuration check (0) and before project analysis (2)", () => {
    const stepZeroIndex = content.indexOf(
      "### 0. Verificar Configuração Existente"
    );
    const stepOneIndex = content.indexOf(
      "### 1. Validação de Skills Empresariais"
    );
    const stepTwoIndex = content.indexOf("### 2. Análise do Projeto");
    expect(stepZeroIndex).toBeGreaterThan(-1);
    expect(stepOneIndex).toBeGreaterThan(-1);
    expect(stepTwoIndex).toBeGreaterThan(-1);
    expect(stepZeroIndex).toBeLessThan(stepOneIndex);
    expect(stepOneIndex).toBeLessThan(stepTwoIndex);
  });

  it("should have consistent step numbering from 0 to 7", () => {
    const expectedSteps = [
      "### 0.",
      "### 1.",
      "### 2.",
      "### 3.",
      "### 4.",
      "### 5.",
      "### 6.",
      "### 7.",
    ];
    for (const step of expectedSteps) {
      expect(content).toContain(step);
    }
  });

  it("should not have duplicate or skipped step numbers", () => {
    const stepPattern = /### (\d+)\./g;
    const stepNumbers: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = stepPattern.exec(content)) !== null) {
      stepNumbers.push(parseInt(match[1], 10));
    }
    expect(stepNumbers).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("should place validation before any project analysis content", () => {
    const validationIndex = content.indexOf(
      "enterprise-skills-check.md"
    );
    const analysisIndex = content.indexOf("Detectar automaticamente");
    expect(validationIndex).toBeGreaterThan(-1);
    expect(analysisIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(analysisIndex);
  });
});
