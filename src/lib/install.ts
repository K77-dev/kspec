import { mkdir, readFile, writeFile, lstat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import fsExtra from "fs-extra";
import chalk from "chalk";
import { linkOrCopy, isOnWindows } from "./platform.js";
import {
  parseAgentFile,
  renderAgentToml,
  resolveSandboxMode,
} from "./agent-toml.js";
import { detectMigration, confirmMigration } from "./migration.js";
import {
  getAgentsSourceDir,
  getAgentsMdSource,
  getClaudeMdSource,
} from "../utils/paths.js";

const { copy, pathExists, readdir } = fsExtra;

export interface InstallOptions {
  force?: boolean;
  sourceAgentsDir?: string;
  sourceAgentsMd?: string;
  sourceClaudeMd?: string;
}

export interface InstallReport {
  linkedSkills: string[];
  linkedAgents: string[];
  generatedTomls: string[];
  errors: string[];
}

const CLAUDE_DIR_LINKS = ["rules", "templates", "validation"] as const;

async function isRealFile(filePath: string): Promise<boolean> {
  try {
    const stat = await lstat(filePath);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function readExistingHash(filePath: string): Promise<string | null> {
  try {
    const existing = await readFile(filePath, "utf-8");
    return hashContent(existing);
  } catch {
    return null;
  }
}

async function copyAgents(sourceAgents: string, targetRoot: string): Promise<void> {
  const targetAgents = resolve(targetRoot, ".agents");
  console.log(chalk.dim("→ Instalando .agents/..."));
  await copy(sourceAgents, targetAgents, { overwrite: true });
}

async function buildClaudeLinks(
  targetRoot: string,
  skills: string[],
  agents: string[],
): Promise<{ linkedSkills: string[]; linkedAgents: string[] }> {
  const targetClaude = resolve(targetRoot, ".claude");
  const targetAgents = resolve(targetRoot, ".agents");
  const linkedSkills: string[] = [];
  const linkedAgents: string[] = [];

  if (isOnWindows()) {
    console.log(chalk.yellow("⚠ Windows detectado — usando cópia em vez de symlinks"));
  }

  await mkdir(resolve(targetClaude, "skills"), { recursive: true });
  for (const skill of skills) {
    const source = resolve(targetAgents, "skills", skill);
    const dest = resolve(targetClaude, "skills", skill);
    const result = await linkOrCopy(source, dest);
    if (result !== "skipped-idempotent") {
      console.log(chalk.green(`✓ Symlink criado: .claude/skills/${skill} → ../../.agents/skills/${skill}`));
    }
    linkedSkills.push(skill);
  }

  await mkdir(resolve(targetClaude, "agents"), { recursive: true });
  for (const agent of agents) {
    const source = resolve(targetAgents, "agents", agent);
    const dest = resolve(targetClaude, "agents", agent);
    const result = await linkOrCopy(source, dest);
    if (result !== "skipped-idempotent") {
      console.log(chalk.green(`✓ Symlink criado: .claude/agents/${agent} → ../../.agents/agents/${agent}`));
    }
    linkedAgents.push(agent);
  }

  for (const dirName of CLAUDE_DIR_LINKS) {
    const source = resolve(targetAgents, dirName);
    const dest = resolve(targetClaude, dirName);
    if (await isRealFile(dest)) continue;
    if (await pathExists(source)) {
      const result = await linkOrCopy(source, dest);
      if (result !== "skipped-idempotent") {
        console.log(chalk.green(`✓ Symlink criado: .claude/${dirName} → ../.agents/${dirName}`));
      }
    }
  }

  return { linkedSkills, linkedAgents };
}

async function buildCodexSkillsLinks(
  targetRoot: string,
  skills: string[],
): Promise<void> {
  const targetAgents = resolve(targetRoot, ".agents");
  const codexSkillsDir = resolve(targetRoot, ".codex", "skills");
  await mkdir(codexSkillsDir, { recursive: true });
  for (const skill of skills) {
    const source = resolve(targetAgents, "skills", skill);
    const dest = resolve(codexSkillsDir, skill);
    const result = await linkOrCopy(source, dest);
    if (result !== "skipped-idempotent") {
      console.log(chalk.green(`✓ Symlink criado: .codex/skills/${skill} → ../../.agents/skills/${skill}`));
    }
  }
}

async function buildCodexAgentsToml(
  targetRoot: string,
  agents: string[],
): Promise<{ generatedTomls: string[]; errors: string[] }> {
  const targetAgents = resolve(targetRoot, ".agents");
  const codexAgentsDir = resolve(targetRoot, ".codex", "agents");
  await mkdir(codexAgentsDir, { recursive: true });
  const generatedTomls: string[] = [];
  const errors: string[] = [];

  for (const agent of agents) {
    const agentMdPath = resolve(targetAgents, "agents", agent, "AGENT.md");
    const tomlPath = resolve(codexAgentsDir, `${agent}.toml`);
    try {
      const doc = parseAgentFile(agentMdPath);
      const sandboxMode = resolveSandboxMode(agent);
      const tomlContent = renderAgentToml(doc, sandboxMode);
      const newHash = hashContent(tomlContent);
      const existingHash = await readExistingHash(tomlPath);
      if (newHash !== existingHash) {
        await writeFile(tomlPath, tomlContent, "utf-8");
        console.log(chalk.green(`✓ Gerado: .codex/agents/${agent}.toml (sandbox=${sandboxMode})`));
      }
      generatedTomls.push(agent);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${agent}: ${message}`);
      console.error(chalk.red(`✗ Erro ao gerar .codex/agents/${agent}.toml: ${message}`));
    }
  }

  return { generatedTomls, errors };
}

async function ensureRootDocs(
  targetRoot: string,
  agentsMdSource: string,
  claudeMdSource: string,
): Promise<void> {
  const docs = [
    { name: "AGENTS.md", source: agentsMdSource },
    { name: "CLAUDE.md", source: claudeMdSource },
  ];
  for (const { name, source } of docs) {
    const dest = resolve(targetRoot, name);
    if (await pathExists(dest)) continue;
    if (await pathExists(source)) {
      const content = await readFile(source, "utf-8");
      await writeFile(dest, content, "utf-8");
      console.log(chalk.green(`✓ Criado: ${name}`));
    }
  }
}

async function listSubdirectories(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

export async function runInstall(opts: InstallOptions = {}): Promise<InstallReport> {
  const targetRoot = process.cwd();
  const sourceAgents = opts.sourceAgentsDir ?? getAgentsSourceDir();
  const agentsMdSource = opts.sourceAgentsMd ?? getAgentsMdSource();
  const claudeMdSource = opts.sourceClaudeMd ?? getClaudeMdSource();
  const targetClaude = resolve(targetRoot, ".claude");

  if (!opts.force) {
    const plan = await detectMigration(targetClaude);
    if (plan !== null) {
      const confirmed = await confirmMigration(plan);
      if (!confirmed) {
        console.log(chalk.red("✗ Migração cancelada pelo usuário"));
        process.exit(1);
      }
    }
  }

  await copyAgents(sourceAgents, targetRoot);

  const targetAgentsDir = resolve(targetRoot, ".agents");
  const skills = await listSubdirectories(resolve(targetAgentsDir, "skills"));
  const agents = await listSubdirectories(resolve(targetAgentsDir, "agents"));

  const { linkedSkills, linkedAgents } = await buildClaudeLinks(
    targetRoot,
    skills,
    agents,
  );

  await buildCodexSkillsLinks(targetRoot, skills);

  const { generatedTomls, errors } = await buildCodexAgentsToml(targetRoot, agents);

  await ensureRootDocs(targetRoot, agentsMdSource, claudeMdSource);

  return { linkedSkills, linkedAgents, generatedTomls, errors };
}
