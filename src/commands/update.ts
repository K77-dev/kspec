import chalk from "chalk";
import { getPackageVersion } from "../utils/paths.js";
import { runInstall } from "../lib/install.js";
import { printInstallSummary } from "../utils/output.js";

export async function runUpdate(): Promise<void> {
  const version = getPackageVersion();
  console.log(chalk.bold(`kspec v${version}`));
  console.log(chalk.dim(`Atualizando kspec em ${process.cwd()}...\n`));

  // force:true needed so detectMigration treats .claude/skills/ as a symlink candidate, not a real dir
  const report = await runInstall({ force: true });

  printInstallSummary(report);
  printUpdateDone();
}

function printUpdateDone(): void {
  console.log("");
  console.log(chalk.bold("Atualização concluída!"));
  console.log(chalk.dim(`  Para atualizar para uma versão mais nova do kspec:`));
  console.log(`  ${chalk.cyan("npm update -g @k77-dev/kspec")}`);
  console.log(`  ${chalk.cyan("kspec update")}`);
}
