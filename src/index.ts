import { Command } from "commander";
import chalk from "chalk";
import { runInit } from "./commands/init.js";
import { runVersion } from "./commands/version.js";
import { getPackageVersion } from "./utils/paths.js";

const program = new Command();

program
  .name("kspec")
  .description("Kit de specs e padrões para projetos com Claude Code")
  .version(getPackageVersion(), "-v, --version", "exibe a versão do kspec");

program
  .command("init")
  .description("Instala skills, agents, rules e templates do kspec no projeto atual")
  .option("-f, --force", "sobrescrever sem perguntar caso .claude/ já exista")
  .action(async (options) => {
    try {
      await runInit({ force: Boolean(options.force) });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command("version")
  .description("Exibe a versão do kspec")
  .action(() => {
    try {
      runVersion();
    } catch (error) {
      handleError(error);
    }
  });

program.parseAsync(process.argv).catch(handleError);

function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`Erro: ${message}`));
  process.exit(1);
}
