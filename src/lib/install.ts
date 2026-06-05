import { mkdir, readFile, writeFile, lstat, readlink, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
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
  getCursorMdSource,
} from "../utils/paths.js";

const { copy, pathExists, readdir } = fsExtra;

export interface InstallOptions {
  force?: boolean;
  sourceAgentsDir?: string;
  sourceAgentsMd?: string;
  sourceClaudeMd?: string;
  sourceCursorMd?: string;
}

export interface InstallReport {
  linkedSkills: string[];
  linkedAgents: string[];
  generatedTomls: string[];
  linkedCursorSkills: string[];
  linkedCursorAgents: string[];
  generatedMdc: string[];
  errors: string[];
}

const CLAUDE_DIR_LINKS = ["rules", "templates", "validation"] as const;
const CURSOR_DIR_LINKS = ["templates", "validation"] as const;

const RULE_FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export interface RuleFrontmatter {
  description?: string;
  paths?: string[];
}

export interface MdcFrontmatter {
  description: string;
  globs?: string;
  alwaysApply: boolean;
}

function yamlScalar(value: string): string {
  if (/[:#\n"'&*!?|>@[\]{},]/.test(value) || value.startsWith(" ") || value.endsWith(" ")) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function readableRuleName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseRuleFrontmatterBlock(block: string): RuleFrontmatter {
  const result: RuleFrontmatter = {};
  const lines = block.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    const descriptionMatch = line.match(/^description:\s*(.+)$/);
    if (descriptionMatch) {
      result.description = descriptionMatch[1]!.trim();
      i++;
      continue;
    }

    if (/^paths:\s*$/.test(line)) {
      const paths: string[] = [];
      i++;
      while (i < lines.length) {
        const itemMatch = lines[i]!.match(/^\s+-\s+(.+)$/);
        if (!itemMatch) break;
        let value = itemMatch[1]!.trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        paths.push(value);
        i++;
      }
      result.paths = paths;
      continue;
    }

    i++;
  }

  return result;
}

function parseRuleRaw(raw: string): { frontmatter: RuleFrontmatter; body: string } {
  const match = raw.match(RULE_FRONTMATTER_REGEX);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  return {
    frontmatter: parseRuleFrontmatterBlock(match[1]!),
    body: match[2]!,
  };
}

function extractDescription(
  frontmatter: RuleFrontmatter,
  body: string,
  name: string,
): string {
  if (frontmatter.description) {
    return frontmatter.description;
  }

  for (const line of body.split("\n")) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      return h1Match[1]!.trim();
    }
  }

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return readableRuleName(name);
}

function buildMdcFrontmatter(name: string, frontmatter: RuleFrontmatter, description: string): MdcFrontmatter {
  const hasPaths = frontmatter.paths !== undefined && frontmatter.paths.length > 0;
  const mdc: MdcFrontmatter = {
    description,
    alwaysApply: name === "code-standards",
  };
  if (hasPaths) {
    mdc.globs = frontmatter.paths!.join(",");
  }
  return mdc;
}

function renderMdcFrontmatter(frontmatter: MdcFrontmatter): string {
  const lines = ["---", `description: ${yamlScalar(frontmatter.description)}`];
  if (frontmatter.globs !== undefined) {
    lines.push(`globs: ${yamlScalar(frontmatter.globs)}`);
  }
  lines.push(`alwaysApply: ${frontmatter.alwaysApply}`);
  lines.push("---");
  return lines.join("\n");
}

export function ruleToMdc(name: string, raw: string): string {
  const { frontmatter, body } = parseRuleRaw(raw);
  const description = extractDescription(frontmatter, body, name);
  const mdcFrontmatter = buildMdcFrontmatter(name, frontmatter, description);
  return `${renderMdcFrontmatter(mdcFrontmatter)}\n${body}`;
}

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

const ENTERPRISE_CACHE_RULES = ".claude/.enterprise-skills-cache/.agents/rules";

async function isRuleSymlinkBroken(rulePath: string): Promise<boolean> {
  try {
    const stat = await lstat(rulePath);
    if (!stat.isSymbolicLink()) return false;
    const linkTarget = await readlink(rulePath);
    const resolved = resolve(dirname(rulePath), linkTarget);
    if (resolved === rulePath) return true;
    await readFile(rulePath, "utf-8");
    return false;
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
    return code === "ELOOP" || code === "ENOENT";
  }
}

async function findEnterpriseCacheRuleFile(
  targetRoot: string,
  basename: string,
): Promise<string | null> {
  const cacheRulesDir = resolve(targetRoot, ENTERPRISE_CACHE_RULES);
  if (!(await pathExists(cacheRulesDir))) return null;

  async function walk(dir: string): Promise<string | null> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        const found = await walk(full);
        if (found) return found;
      } else if (entry.isFile() && entry.name === `${basename}.md`) {
        return full;
      }
    }
    return null;
  }

  return walk(cacheRulesDir);
}

async function repairBrokenRuleSymlinks(targetRoot: string): Promise<void> {
  const rulesDir = resolve(targetRoot, ".agents", "rules");
  if (!(await pathExists(rulesDir))) return;

  const entries = await readdir(rulesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.endsWith(".md")) continue;
    const rulePath = resolve(rulesDir, entry.name);
    if (!(await isRuleSymlinkBroken(rulePath))) continue;

    const basename = entry.name.replace(/\.md$/, "");
    const cacheFile = await findEnterpriseCacheRuleFile(targetRoot, basename);
    if (cacheFile) {
      const content = await readFile(cacheFile, "utf-8");
      await rm(rulePath, { force: true });
      await writeFile(rulePath, content, "utf-8");
      console.log(
        chalk.green(`✓ Reparado: .agents/rules/${entry.name} (symlink circular → arquivo real)`),
      );
    } else {
      await rm(rulePath, { force: true });
      console.warn(
        chalk.yellow(
          `⚠ Removido symlink circular: .agents/rules/${entry.name} — reinstale via validação empresarial`,
        ),
      );
    }
  }
}

async function copyAgents(sourceAgents: string, targetRoot: string): Promise<void> {
  const targetAgents = resolve(targetRoot, ".agents");
  if (resolve(sourceAgents) === resolve(targetAgents)) {
    console.log(
      chalk.dim("→ .agents/ já é o source of truth neste diretório — pulando cópia."),
    );
    return;
  }
  console.log(chalk.dim("→ Instalando .agents/..."));
  await copy(sourceAgents, targetAgents, { overwrite: true });

  const validationPath = resolve(targetAgents, "validation", "enterprise-skills-check.md");
  const content = await readFile(validationPath, "utf-8").catch(() => "");
  if (content.length < 1000 || !content.includes("Validation Algorithm")) {
    console.warn(
      chalk.yellow(
        "⚠ .agents/validation/enterprise-skills-check.md parece truncado. Pacote kspec pode estar corrompido — reinstale.",
      ),
    );
  }
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

async function buildCursorSkillsLinks(
  targetRoot: string,
  skills: string[],
): Promise<{ linkedCursorSkills: string[] }> {
  const targetAgents = resolve(targetRoot, ".agents");
  const cursorSkillsDir = resolve(targetRoot, ".cursor", "skills");
  const linkedCursorSkills: string[] = [];

  await mkdir(cursorSkillsDir, { recursive: true });
  for (const skill of skills) {
    const source = resolve(targetAgents, "skills", skill);
    const dest = resolve(cursorSkillsDir, skill);
    const result = await linkOrCopy(source, dest);
    if (result !== "skipped-idempotent") {
      console.log(chalk.green(`✓ Symlink criado: .cursor/skills/${skill} → ../../.agents/skills/${skill}`));
    }
    linkedCursorSkills.push(skill);
  }

  return { linkedCursorSkills };
}

async function buildCursorAgentsLinks(
  targetRoot: string,
  agents: string[],
): Promise<{ linkedCursorAgents: string[] }> {
  const targetAgents = resolve(targetRoot, ".agents");
  const cursorAgentsDir = resolve(targetRoot, ".cursor", "agents");
  const linkedCursorAgents: string[] = [];

  await mkdir(cursorAgentsDir, { recursive: true });
  for (const agent of agents) {
    const source = resolve(targetAgents, "agents", agent);
    const dest = resolve(cursorAgentsDir, agent);
    const result = await linkOrCopy(source, dest);
    if (result !== "skipped-idempotent") {
      console.log(chalk.green(`✓ Symlink criado: .cursor/agents/${agent} → ../../.agents/agents/${agent}`));
    }
    linkedCursorAgents.push(agent);
  }

  return { linkedCursorAgents };
}

async function buildCursorDirLinks(targetRoot: string): Promise<void> {
  const targetAgents = resolve(targetRoot, ".agents");
  const targetCursor = resolve(targetRoot, ".cursor");

  for (const dirName of CURSOR_DIR_LINKS) {
    const source = resolve(targetAgents, dirName);
    const dest = resolve(targetCursor, dirName);
    if (await isRealFile(dest)) continue;
    if (await pathExists(source)) {
      const result = await linkOrCopy(source, dest);
      if (result !== "skipped-idempotent") {
        console.log(chalk.green(`✓ Symlink criado: .cursor/${dirName} → ../.agents/${dirName}`));
      }
    }
  }
}

async function buildCursorRulesMdc(
  targetRoot: string,
): Promise<{ generatedMdc: string[]; errors: string[] }> {
  const targetAgents = resolve(targetRoot, ".agents");
  const rulesDir = resolve(targetAgents, "rules");
  const cursorRulesDir = resolve(targetRoot, ".cursor", "rules");
  const generatedMdc: string[] = [];
  const errors: string[] = [];

  await mkdir(cursorRulesDir, { recursive: true });

  const entries = (await pathExists(rulesDir))
    ? await readdir(rulesDir, { withFileTypes: true })
    : [];

  const sourceRuleNames = new Set<string>();

  for (const entry of entries) {
    if (!entry.name.endsWith(".md")) continue;
    const name = entry.name.replace(/\.md$/, "");
    sourceRuleNames.add(name);
    const rulePath = resolve(rulesDir, entry.name);

    try {
      const raw = await readFile(rulePath, "utf-8");
      const mdcContent = ruleToMdc(name, raw);
      const mdcPath = resolve(cursorRulesDir, `${name}.mdc`);
      const newHash = hashContent(mdcContent);
      const existingHash = await readExistingHash(mdcPath);
      if (newHash !== existingHash) {
        await writeFile(mdcPath, mdcContent, "utf-8");
        console.log(chalk.green(`✓ Gerado: .cursor/rules/${name}.mdc`));
      }
      generatedMdc.push(name);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${name}: ${message}`);
      const hint =
        message.includes("ELOOP") || message.includes("too many symbolic links")
          ? `symlink circular ou quebrado em .agents/rules/${entry.name}`
          : "alvo não resolvido";
      console.warn(chalk.yellow(`✗ rule ${name} ignorada: ${hint}`));
    }
  }

  const cursorEntries = await readdir(cursorRulesDir, { withFileTypes: true });
  for (const entry of cursorEntries) {
    if (!entry.name.endsWith(".mdc")) continue;
    const name = entry.name.replace(/\.mdc$/, "");
    if (!sourceRuleNames.has(name)) {
      const orphanPath = resolve(cursorRulesDir, entry.name);
      await rm(orphanPath, { force: true });
      console.log(chalk.dim(`→ Removido órfão: .cursor/rules/${entry.name}`));
    }
  }

  return { generatedMdc, errors };
}

async function ensureRootDocs(
  targetRoot: string,
  agentsMdSource: string,
  claudeMdSource: string,
  cursorMdSource: string,
): Promise<void> {
  const docs = [
    { name: "AGENTS.md", source: agentsMdSource },
    { name: "CLAUDE.md", source: claudeMdSource },
    { name: "CURSOR.md", source: cursorMdSource },
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
  const cursorMdSource = opts.sourceCursorMd ?? getCursorMdSource();
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
  await repairBrokenRuleSymlinks(targetRoot);

  const targetAgentsDir = resolve(targetRoot, ".agents");
  const skills = await listSubdirectories(resolve(targetAgentsDir, "skills"));
  const agents = await listSubdirectories(resolve(targetAgentsDir, "agents"));

  const { linkedSkills, linkedAgents } = await buildClaudeLinks(
    targetRoot,
    skills,
    agents,
  );

  await buildCodexSkillsLinks(targetRoot, skills);

  const { generatedTomls, errors: tomlErrors } = await buildCodexAgentsToml(targetRoot, agents);

  const { linkedCursorSkills } = await buildCursorSkillsLinks(targetRoot, skills);
  const { linkedCursorAgents } = await buildCursorAgentsLinks(targetRoot, agents);
  await buildCursorDirLinks(targetRoot);
  const { generatedMdc, errors: mdcErrors } = await buildCursorRulesMdc(targetRoot);

  await ensureRootDocs(targetRoot, agentsMdSource, claudeMdSource, cursorMdSource);

  return {
    linkedSkills,
    linkedAgents,
    generatedTomls,
    linkedCursorSkills,
    linkedCursorAgents,
    generatedMdc,
    errors: [...tomlErrors, ...mdcErrors],
  };
}
