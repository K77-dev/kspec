import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const VALIDATION_REFERENCE = "@.claude/validation/enterprise-skills-check.md";
const VALIDATION_BLOCK_HEADING = "### 0. Validação de Skills Empresariais (Obrigatório)";
const VALIDATION_BLOCK_TEXT = "NÃO prossiga para o próximo passo se a validação\nbloquear a execução.";

const agents = [
  {
    name: "kspec-task-runner",
    path: ".claude/agents/kspec-task-runner/AGENT.md",
    firstOperationalStep: "### 1. Configuração Pré-Tarefa",
  },
  {
    name: "kspec-review-runner",
    path: ".claude/agents/kspec-review-runner/AGENT.md",
    firstOperationalStep: "### 1. Análise de Documentação (Obrigatório)",
  },
  {
    name: "kspec-qa-runner",
    path: ".claude/agents/kspec-qa-runner/AGENT.md",
    firstOperationalStep: "### 1. Análise de Documentação (Obrigatório)",
  },
] as const;

describe("Agent enterprise skills validation (Task 4.0)", () => {
  for (const agent of agents) {
    describe(agent.name, () => {
      const filePath = resolve(ROOT, agent.path);

      it("should exist", () => {
        expect(existsSync(filePath)).toBe(true);
      });

      it("should contain the validation reference to enterprise-skills-check.md", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toContain(VALIDATION_REFERENCE);
      });

      it("should contain the Step 0 heading", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toContain(VALIDATION_BLOCK_HEADING);
      });

      it("should contain the blocking instruction text", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toContain(VALIDATION_BLOCK_TEXT);
      });

      it("should have the validation step BEFORE the first operational step", () => {
        const content = readFileSync(filePath, "utf-8");
        const validationIndex = content.indexOf(VALIDATION_BLOCK_HEADING);
        const firstStepIndex = content.indexOf(agent.firstOperationalStep);
        expect(validationIndex).toBeGreaterThan(-1);
        expect(firstStepIndex).toBeGreaterThan(-1);
        expect(validationIndex).toBeLessThan(firstStepIndex);
      });

      it("should not alter the numbering of existing steps", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toContain(agent.firstOperationalStep);
      });

      it("should preserve the original frontmatter", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toMatch(/^---\nname: /);
        expect(content).toContain(`name: ${agent.name}`);
      });
    });
  }

  describe("integration: no existing content removed", () => {
    it("kspec-task-runner should still contain all original steps", () => {
      const content = readFileSync(resolve(ROOT, ".claude/agents/kspec-task-runner/AGENT.md"), "utf-8");
      const expectedSteps = [
        "### 1. Configuração Pré-Tarefa",
        "### 2. Análise da Tarefa",
        "### 3. Resumo da Tarefa",
        "### 4. Plano de Abordagem",
        "### 5. Implementação",
        "### 6. Escrever Testes (Obrigatório)",
        "### 7. Verificação",
      ];
      for (const step of expectedSteps) {
        expect(content).toContain(step);
      }
    });

    it("kspec-review-runner should still contain all original steps", () => {
      const content = readFileSync(resolve(ROOT, ".claude/agents/kspec-review-runner/AGENT.md"), "utf-8");
      const expectedSteps = [
        "### 1. Análise de Documentação (Obrigatório)",
        "### 2. Análise das Mudanças de Código (Obrigatório)",
        "### 3. Verificação de Conformidade com Rules (Obrigatório)",
        "### 4. Verificação de Aderência à TechSpec (Obrigatório)",
        "### 5. Verificação de Completude das Tasks (Obrigatório)",
        "### 6. Execução dos Testes (Obrigatório)",
        "### 7. Análise de Qualidade de Código (Obrigatório)",
        "### 8. Relatório de Code Review (Obrigatório)",
      ];
      for (const step of expectedSteps) {
        expect(content).toContain(step);
      }
    });

    it("kspec-qa-runner should still contain all original steps", () => {
      const content = readFileSync(resolve(ROOT, ".claude/agents/kspec-qa-runner/AGENT.md"), "utf-8");
      const expectedSteps = [
        "### 1. Análise de Documentação (Obrigatório)",
        "### 2. Preparação do Ambiente (Obrigatório)",
        "### 3. Testes E2E com TestSprite MCP (Obrigatório)",
        "### 4. Verificações de Acessibilidade — WCAG 2.2 (Obrigatório)",
        "### 5. Verificações Visuais (Obrigatório)",
        "### 6. Relatório de QA (Obrigatório)",
      ];
      for (const step of expectedSteps) {
        expect(content).toContain(step);
      }
    });
  });
});
