import { resolve } from "node:path";
import { cwd } from "node:process";
import chalk from "chalk";
import fsExtra from "fs-extra";
import { getClaudeSourceDir, getPackageVersion } from "../utils/paths.js";
import { copyDirIfExists, joinDest } from "../utils/files.js";

const { pathExists } = fsExtra;

const COMPONENTS = ["skills", "agents", "rules", "templates"] as const;

export async function runUpdate(): Promise<void> {
  const targetRoot = cwd();
  const targetClaude = resolve(targetRoot, ".claude");
  const sourceClaude = getClaudeSourceDir();
  const version = getPackageVersion();

  console.log(chalk.bold(`kspec v${version}`));
  console.log(chalk.dim(`Atualizando kspec em ${targetRoot}...\n`));

  if (!(await pathExists(targetClaude))) {
    console.log(chalk.yellow("Pasta .claude/ não encontrada. Rode kspec init primeiro."));
    return;
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

  console.log("");
  console.log(chalk.bold("Atualização concluída!"));
  console.log(chalk.dim(`  Para atualizar para uma versão mais nova do kspec:`));
  console.log(`  ${chalk.cyan("npm update -g @k77-dev/kspec")}`);
  console.log(`  ${chalk.cyan("kspec update")}`);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
