import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

const STEP_0_BLOCK = `### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.`;

const SKILLS = [
  "kspec-prd",
  "kspec-techspec",
  "kspec-tasks",
  "kspec-implement-task",
  "kspec-implement-all-tasks",
  "kspec-qa",
  "kspec-bugfix",
] as const;

const ORIGINAL_FIRST_STEPS: Record<string, string> = {
  "kspec-prd": "### 1. Esclarecer Requisitos (Obrigatório)",
  "kspec-techspec": "### 1. Analisar PRD (Obrigatório)",
  "kspec-tasks": "1. **Analisar PRD e Tech Spec**",
  "kspec-implement-task": "### 1. Identificar Próxima Task Pendente (Obrigatório)",
  "kspec-implement-all-tasks": "### 1. Identificar Tasks Pendentes (Obrigatório)",
  "kspec-qa": "Delegue a execução ao agent",
  "kspec-bugfix": "### 1. Análise de Contexto (Obrigatório)",
};

describe("Task 3.0: Step 0 insertion in all 7 kspec skills", () => {
  for (const skillName of SKILLS) {
    describe(`${skillName}/SKILL.md`, () => {
      const filePath = resolve(ROOT, `.claude/skills/${skillName}/SKILL.md`);

      it("should exist", () => {
        expect(existsSync(filePath)).toBe(true);
      });

      it("should contain the reference to enterprise-skills-check.md", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toContain("@.claude/validation/enterprise-skills-check.md");
      });

      it("should contain the full Step 0 block", () => {
        const content = readFileSync(filePath, "utf-8");
        expect(content).toContain(STEP_0_BLOCK);
      });

      it("should have Step 0 positioned before the original first step", () => {
        const content = readFileSync(filePath, "utf-8");
        const step0Index = content.indexOf("### 0. Validação de Skills Empresariais (Obrigatório)");
        const originalFirstStep = ORIGINAL_FIRST_STEPS[skillName];
        const firstStepIndex = content.indexOf(originalFirstStep);
        expect(step0Index).toBeGreaterThan(-1);
        expect(firstStepIndex).toBeGreaterThan(-1);
        expect(step0Index).toBeLessThan(firstStepIndex);
      });

      it("should still contain the original first step unchanged", () => {
        const content = readFileSync(filePath, "utf-8");
        const originalFirstStep = ORIGINAL_FIRST_STEPS[skillName];
        expect(content).toContain(originalFirstStep);
      });
    });
  }
});

describe("Task 3.0: Integration - no existing content removed", () => {
  const EXPECTED_CONTENT_SAMPLES: Record<string, string[]> = {
    "kspec-prd": [
      "name: kspec-prd",
      "## Fluxo de Trabalho",
      "### 2. Planejar (Obrigatório)",
      "## Checklist de Qualidade",
    ],
    "kspec-techspec": [
      "name: kspec-techspec",
      "## Fluxo de Trabalho",
      "### 2. Análise Profunda do Projeto (Obrigatório)",
      "## Checklist de Qualidade",
    ],
    "kspec-tasks": [
      "name: kspec-tasks",
      "## Etapas do Processo",
      "2. **Gerar Estrutura de Tarefas e Aprovar**",
      "## Diretrizes de Criação de Tarefas",
    ],
    "kspec-implement-task": [
      "name: kspec-implement-task",
      "## Etapas para Executar",
      "### 2. Delegar Implementação (Obrigatório)",
      "## Checklist de Qualidade",
    ],
    "kspec-implement-all-tasks": [
      "name: kspec-implement-all-tasks",
      "## Fluxo de Execução",
      "### 2. Executar Tasks",
      "### 3. Relatório Final",
    ],
    "kspec-qa": [
      "name: kspec-qa",
      "## Funcionalidade",
      "Delegue a execução ao agent",
      "Após o agent concluir",
    ],
    "kspec-bugfix": [
      "name: kspec-bugfix",
      "## Etapas para Executar",
      "### 2. Planejamento das Correções (Obrigatório)",
      "## Checklist de Qualidade",
    ],
  };

  for (const skillName of SKILLS) {
    it(`${skillName}/SKILL.md should retain all original content`, () => {
      const filePath = resolve(ROOT, `.claude/skills/${skillName}/SKILL.md`);
      const content = readFileSync(filePath, "utf-8");
      const samples = EXPECTED_CONTENT_SAMPLES[skillName];
      for (const sample of samples) {
        expect(content).toContain(sample);
      }
    });
  }
});
