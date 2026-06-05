import chalk from "chalk";
import type { InstallReport } from "../lib/install.js";

export function printInstallSummary(report: InstallReport): void {
  const hasCursorArtifacts =
    report.linkedCursorSkills.length > 0 ||
    report.linkedCursorAgents.length > 0 ||
    report.generatedMdc.length > 0;

  if (hasCursorArtifacts) {
    console.log(chalk.green("\n✓ Cursor"));
    if (report.linkedCursorSkills.length > 0) {
      console.log(
        chalk.green(
          `  → ${report.linkedCursorSkills.length} skill(s) em .cursor/skills/`,
        ),
      );
    }
    if (report.linkedCursorAgents.length > 0) {
      console.log(
        chalk.green(
          `  → ${report.linkedCursorAgents.length} agent(s) em .cursor/agents/`,
        ),
      );
    }
    if (report.generatedMdc.length > 0) {
      console.log(
        chalk.green(
          `  → ${report.generatedMdc.length} rule(s) .mdc em .cursor/rules/`,
        ),
      );
    }
  }

  if (report.errors.length === 0) return;

  console.log(chalk.yellow(`\n⚠ ${report.errors.length} erro(s) durante a instalação:`));
  for (const err of report.errors) {
    console.log(chalk.yellow(`  - ${err}`));
  }
}
