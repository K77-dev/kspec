import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
const BOOTSTRAP_SKILL = resolve(ROOT, ".agents/skills/kspec-bootstrap/SKILL.md");
const CURSOR_TEMPLATE = resolve(ROOT, ".agents/templates/cursor-md-template.md");

function readBootstrapSkill(): string {
  expect(existsSync(BOOTSTRAP_SKILL), "kspec-bootstrap/SKILL.md must exist").toBe(true);
  return readFileSync(BOOTSTRAP_SKILL, "utf-8");
}

/** All 7 non-empty platform combinations (REQ-004 / task 7.0). */
const PLATFORM_MATRIX: Array<{
  choice: string;
  files: string[];
}> = [
  { choice: "Claude Code apenas", files: ["CLAUDE.bootstrap.md"] },
  { choice: "Codex CLI apenas", files: ["AGENTS.bootstrap.md"] },
  { choice: "Cursor apenas", files: ["CURSOR.bootstrap.md"] },
  {
    choice: "Claude + Codex",
    files: ["CLAUDE.bootstrap.md", "AGENTS.bootstrap.md"],
  },
  {
    choice: "Claude + Cursor",
    files: ["CLAUDE.bootstrap.md", "CURSOR.bootstrap.md"],
  },
  {
    choice: "Codex + Cursor",
    files: ["AGENTS.bootstrap.md", "CURSOR.bootstrap.md"],
  },
  {
    choice: "Todas (Recomendado)",
    files: ["CLAUDE.bootstrap.md", "AGENTS.bootstrap.md", "CURSOR.bootstrap.md"],
  },
];

const FINAL_DOCS = ["CLAUDE.md", "AGENTS.md", "CURSOR.md"];

describe("kspec-bootstrap tri-platform (REQ-004 / task 7.0)", () => {
  const content = readBootstrapSkill();

  it("documents all 7 platform combinations in the generation matrix", () => {
    for (const { choice, files } of PLATFORM_MATRIX) {
      expect(content, `matrix must mention choice: ${choice}`).toContain(choice);
      for (const file of files) {
        expect(content, `${choice} must map to ${file}`).toContain(file);
      }
    }
  });

  it("dry-run: each matrix row produces exactly the expected bootstrap files", () => {
    const matrixSection = content.slice(
      content.indexOf("## Matriz de Geração de Artefatos"),
      content.indexOf("## Fluxo de Trabalho")
    );

    for (const { choice, files } of PLATFORM_MATRIX) {
      const rowStart = matrixSection.indexOf(choice);
      expect(rowStart, `matrix row for "${choice}"`).toBeGreaterThanOrEqual(0);

      const rowEnd = matrixSection.indexOf("\n", rowStart);
      const row = matrixSection.slice(rowStart, rowEnd);

      for (const file of files) {
        expect(row, `${choice} row must include ${file}`).toContain(file);
      }

      const unexpected = ["CLAUDE.bootstrap.md", "AGENTS.bootstrap.md", "CURSOR.bootstrap.md"].filter(
        (f) => !files.includes(f)
      );
      for (const file of unexpected) {
        expect(row, `${choice} row must not include ${file}`).not.toContain(file);
      }
    }
  });

  it("lists all platform options in step 4 including Todas (Recomendado)", () => {
    const step4 = content.slice(
      content.indexOf("### 4. Escolha de Plataformas"),
      content.indexOf("### 4A.")
    );

    for (const { choice } of PLATFORM_MATRIX) {
      expect(step4, `step 4 must offer: ${choice}`).toContain(choice);
    }
  });

  it("never overwrites final docs — only writes *.bootstrap.md", () => {
    expect(content).toMatch(/nunca sobrescreva.*CLAUDE\.md/i);
    expect(content).toMatch(/nunca sobrescreva.*AGENTS\.md/i);
    expect(content).toMatch(/nunca sobrescreve.*CURSOR\.md/i);

    for (const final of FINAL_DOCS) {
      expect(content, `must protect ${final}`).toContain(final);
    }

    expect(content).toMatch(/escreva apenas `\*\.bootstrap\.md`/i);
  });

  it("documents AskQuestion for Cursor with numbered fallback when unavailable", () => {
    expect(content).toContain("AskQuestion");
    expect(content).toContain("AskUserQuestion");
    expect(content).toMatch(/fallback/i);
    expect(content).toMatch(/lista numerada/i);
  });

  it("documents non-interactive abort with clear message for all platforms", () => {
    expect(content).toMatch(/modo não-interativo|não-interativo/i);
    expect(content).toContain("codex exec");
    expect(content).toContain("cursor");
    expect(content).toMatch(/Aborte a execução sem gerar nenhum arquivo/i);
  });

  it("MCP opt-in defaults to Não and writes only on explicit Sim", () => {
    expect(content).toMatch(/default \*\*Não\*\*/i);
    expect(content).toContain(".codex/config.toml");
    expect(content).toContain(".cursor/mcp.json");
    expect(content).toMatch(/assumir `Não`/i);
    expect(content).toMatch(/confirmação explícita/i);
    expect(content).toMatch(/criado apenas se usuário aceitou/i);
  });

  it("Cursor MCP schema uses mcpServers with context7 and testsprite", () => {
    const mcpSection = content.slice(
      content.indexOf("### 4E. MCP Opt-in Cursor"),
      content.indexOf("### 5. Selecionar Rules")
    );

    expect(mcpSection).toContain('"mcpServers"');
    expect(mcpSection).toContain("context7");
    expect(mcpSection).toContain("testsprite");
    expect(mcpSection).toContain("testsprite-mcp");
  });

  it("CURSOR.bootstrap.md section references cursor-md-template.md", () => {
    expect(content).toContain("@.agents/templates/cursor-md-template.md");
    expect(existsSync(CURSOR_TEMPLATE), "cursor-md-template.md must exist").toBe(true);
  });

  it("conditional generation sections cover Claude, Codex and Cursor", () => {
    expect(content).toContain("### 4A. Gerar CLAUDE.bootstrap.md");
    expect(content).toContain("### 4B. Gerar AGENTS.bootstrap.md");
    expect(content).toContain("### 4C. Gerar CURSOR.bootstrap.md");
    expect(content).toContain("### 4D. MCP Opt-in Codex");
    expect(content).toContain("### 4E. MCP Opt-in Cursor");
  });

  it("final report includes next steps for Cursor", () => {
    expect(content).toContain("CURSOR.bootstrap.md");
    expect(content).toMatch(/renomeie para `CURSOR\.md`/i);
    expect(content).toContain("kspec-prd");
  });
});
