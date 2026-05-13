import chalk from "chalk";
import type { InstallReport } from "../lib/install.js";

export function printInstallSummary(report: InstallReport): void {
  if (report.errors.length === 0) return;
  console.log(chalk.yellow(`\n⚠ ${report.errors.length} erro(s) durante a instalação:`));
  for (const err of report.errors) {
    console.log(chalk.yellow(`  - ${err}`));
  }
}
