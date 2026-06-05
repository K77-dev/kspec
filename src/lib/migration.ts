import { lstat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolve, basename, dirname } from "node:path";
import chalk from "chalk";

export interface MigrationPlan {
  realDirs: string[];
  filesPreserved: string[];
  actions: string[];
}

const CLAUDE_EXPECTED_SUBDIRS = ["skills", "agents", "rules", "templates", "validation"];
const CURSOR_EXPECTED_SUBDIRS = ["skills", "agents", "templates", "validation"];
const PRESERVED_FILES = ["settings.json", "settings.local.json"];

async function classifyEntry(entryPath: string): Promise<"real-dir" | "symlink" | "absent"> {
  try {
    const stat = await lstat(entryPath);
    if (stat.isSymbolicLink()) return "symlink";
    if (stat.isDirectory()) return "real-dir";
    return "absent";
  } catch {
    return "absent";
  }
}

function buildActions(realDirs: string[]): string[] {
  const actions: string[] = [];
  let counter = 1;
  for (const dirPath of realDirs) {
    const platformDir = basename(dirname(dirPath));
    const sub = basename(dirPath);
    actions.push(
      `${counter}. Mover \`${platformDir}/${sub}/\` para \`.agents/${sub}/\``,
    );
    counter++;
    actions.push(
      `${counter}. Criar symlink \`${platformDir}/${sub}/\` → \`../../.agents/${sub}\``,
    );
    counter++;
  }
  return actions;
}

function collectPreservedFiles(targetClaude: string): string[] {
  return PRESERVED_FILES.filter((file) =>
    existsSync(resolve(targetClaude, file)),
  );
}

async function detectRealDirs(baseDir: string, subdirs: string[]): Promise<string[]> {
  const realDirs: string[] = [];
  for (const sub of subdirs) {
    const entryPath = resolve(baseDir, sub);
    const classification = await classifyEntry(entryPath);
    if (classification === "real-dir") {
      realDirs.push(entryPath);
    }
  }
  return realDirs;
}

export async function detectMigration(targetClaude: string): Promise<MigrationPlan | null> {
  const targetRoot = dirname(targetClaude);
  const targetCursor = resolve(targetRoot, ".cursor");

  const claudeRealDirs = await detectRealDirs(targetClaude, CLAUDE_EXPECTED_SUBDIRS);
  const cursorRealDirs = await detectRealDirs(targetCursor, CURSOR_EXPECTED_SUBDIRS);
  const realDirs = [...claudeRealDirs, ...cursorRealDirs];

  if (realDirs.length === 0) return null;
  const filesPreserved = collectPreservedFiles(targetClaude);
  const actions = buildActions(realDirs);
  return { realDirs, filesPreserved, actions };
}

export async function confirmMigration(plan: MigrationPlan): Promise<boolean> {
  console.log(chalk.yellow("\n⚠ Migração necessária"));
  console.log(
    chalk.white(
      "Os seguintes diretórios de discovery são reais (não symlinks):",
    ),
  );
  for (const dir of plan.realDirs) {
    console.log(chalk.white(`  - ${dir}`));
  }
  if (plan.filesPreserved.length > 0) {
    console.log(chalk.green("\nArquivos que serão preservados:"));
    for (const file of plan.filesPreserved) {
      console.log(chalk.green(`  ✓ .claude/${file}`));
    }
  }
  console.log(chalk.white("\nPlano de migração:"));
  for (const action of plan.actions) {
    console.log(chalk.white(`  ${action}`));
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (
      await rl.question(chalk.yellow("\nDeseja prosseguir com a migração? (s/N) "))
    )
      .trim()
      .toLowerCase();
    return answer === "s" || answer === "sim";
  } finally {
    rl.close();
  }
}
