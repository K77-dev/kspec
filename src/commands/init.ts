import { resolve } from "node:path";
import { cwd } from "node:process";
import chalk from "chalk";
import fsExtra from "fs-extra";
import { getClaudeSourceDir, getPackageVersion } from "../utils/paths.js";
import { copyDirIfExists, joinDest } from "../utils/files.js";
import { confirm } from "../utils/prompt.js";

const { pathExists } = fsExtra;

const COMPONENTS = ["skills", "agents", "rules", "templates"] as const;

export interface InitOptions {
  force?: boolean;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const targetRoot = cwd();
  const targetClaude = resolve(targetRoot, ".claude");
  const sourceClaude = getClaudeSourceDir();

  console.log(chalk.bold(`kspec v${getPackageVersion()}`));
  console.log(chalk.dim(`Instalando kspec em ${targetRoot}...\n`));

  if (await pathExists(targetClaude)) {
    if (!options.force) {
      const proceed = await confirm(
        chalk.yellow("Já existe uma pasta .claude/ neste projeto. Sobrescrever os componentes do kspec?"),
        false,
      );
      if (!proceed) {
        console.log(chalk.dim("Operação cancelada."));
        return;
      }
    }
  }

  for (const component of COMPONENTS) {
    const source = resolve(sourceClaude, component);
    const destination = joinDest(targetClaude, component);
    const result = await copyDirIfExists(source, destination, component);
    if (result.copied) {
      console.log(`${chalk.green("✔")} ${capitalize(component).padEnd(10)} ${chalk.dim(`(.claude/${component}/)`)}`);
    } else {
      console.log(`${chalk.gray("·")} ${capitalize(component).padEnd(10)} ${chalk.dim("(não encontrado no pacote)")}`);
    }
  }

  printNextSteps();
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function printNextSteps(): void {
  console.log("");
  console.log(chalk.bold("Pronto! Próximos passos:"));
  console.log(`  1. Abra o projeto no Claude Code`);
  console.log(`  2. ${chalk.cyan("/kspec-bootstrap")} → gere o CLAUDE.md do projeto`);
  console.log(`  3. ${chalk.cyan("/kspec-version")}   → veja skills disponíveis`);
  console.log(`  4. ${chalk.cyan("/kspec-prd")}       → crie seu primeiro PRD`);
}
