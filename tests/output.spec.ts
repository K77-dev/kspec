import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import chalk from "chalk";
import { printInstallSummary } from "../src/utils/output.js";
import type { InstallReport } from "../src/lib/install.js";

function emptyReport(overrides: Partial<InstallReport> = {}): InstallReport {
  return {
    linkedSkills: [],
    linkedAgents: [],
    generatedTomls: [],
    linkedCursorSkills: [],
    linkedCursorAgents: [],
    generatedMdc: [],
    errors: [],
    ...overrides,
  };
}

describe("printInstallSummary", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("prints nothing when report has no Cursor artifacts and no errors", () => {
    printInstallSummary(emptyReport());

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("includes Cursor skill count in summary", () => {
    printInstallSummary(
      emptyReport({
        linkedCursorSkills: ["kspec-prd", "kspec-qa"],
      }),
    );

    const output = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("✓ Cursor");
    expect(output).toContain("2 skill(s) em .cursor/skills/");
  });

  it("includes Cursor agent count in summary", () => {
    printInstallSummary(
      emptyReport({
        linkedCursorAgents: ["kspec-task-runner", "kspec-review-runner", "kspec-qa-runner"],
      }),
    );

    const output = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("3 agent(s) em .cursor/agents/");
  });

  it("includes generated .mdc count in summary", () => {
    printInstallSummary(
      emptyReport({
        generatedMdc: ["code-standards", "logging"],
      }),
    );

    const output = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("2 rule(s) .mdc em .cursor/rules/");
  });

  it("prints all Cursor artifact counts when present", () => {
    printInstallSummary(
      emptyReport({
        linkedCursorSkills: ["kspec-prd"],
        linkedCursorAgents: ["kspec-task-runner"],
        generatedMdc: ["code-standards"],
      }),
    );

    const output = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("1 skill(s) em .cursor/skills/");
    expect(output).toContain("1 agent(s) em .cursor/agents/");
    expect(output).toContain("1 rule(s) .mdc em .cursor/rules/");
  });

  it("prints errors after Cursor summary when both are present", () => {
    printInstallSummary(
      emptyReport({
        linkedCursorSkills: ["kspec-prd"],
        errors: ["rule X ignorada: alvo não resolvido"],
      }),
    );

    const output = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("✓ Cursor");
    expect(output).toContain(chalk.yellow("1 erro(s) durante a instalação:"));
    expect(output).toContain("rule X ignorada: alvo não resolvido");
  });

  it("prints only errors when no Cursor artifacts exist", () => {
    printInstallSummary(
      emptyReport({
        errors: ["falha ao gerar toml"],
      }),
    );

    const output = logSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).not.toContain("✓ Cursor");
    expect(output).toContain("falha ao gerar toml");
  });
});
