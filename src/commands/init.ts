import chalk from "chalk";
import { getPackageVersion } from "../utils/paths.js";
import { runInstall } from "../lib/install.js";
import { printInstallSummary } from "../utils/output.js";

export interface InitOptions {
  force?: boolean;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  console.log(chalk.bold(`kspec v${getPackageVersion()}`));
  console.log(chalk.dim(`Instalando kspec em ${process.cwd()}...\n`));

  const report = await runInstall({ force: options.force });

  printInstallSummary(report);
  printNextSteps();
}

function printNextSteps(): void {
  console.log("");
  console.log(chalk.bold("Pronto! Próximos passos:"));
  console.log(`  1. Abra o projeto no Claude Code ou Codex CLI`);
  console.log(`  2. ${chalk.cyan("/kspec-bootstrap")} → gere o CLAUDE.md do projeto`);
  console.log(`  3. ${chalk.cyan("/kspec-version")}   → veja skills disponíveis`);
  console.log(`  4. ${chalk.cyan("/kspec-prd")}       → crie seu primeiro PRD`);
}
