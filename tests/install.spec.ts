import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import {
  mkdtemp,
  rm,
  mkdir,
  writeFile,
  readFile,
  lstat,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import fsExtra from "fs-extra";
import { runInstall } from "../src/lib/install.js";
import * as migrationModule from "../src/lib/migration.js";

const { pathExists } = fsExtra;

async function createTmpDir(): Promise<string> {
  return mkdtemp(resolve(tmpdir(), "kspec-install-"));
}

async function removeTmpDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

function buildAgentMd(name: string, description: string, body: string): string {
  return `---\nname: ${name}\nversion: 1.0.0\ndescription: ${description}\n---\n${body}`;
}

function buildSkillMd(name: string): string {
  return `---\nname: ${name}\nversion: 1.0.0\ndescription: Skill ${name}\n---\n# ${name}\n`;
}

async function buildFakeAgentsDir(agentsDir: string): Promise<void> {
  await mkdir(resolve(agentsDir, "skills", "fake-skill-a"), { recursive: true });
  await mkdir(resolve(agentsDir, "skills", "fake-skill-b"), { recursive: true });
  await mkdir(resolve(agentsDir, "agents", "fake-task-runner"), { recursive: true });
  await mkdir(resolve(agentsDir, "agents", "fake-review-runner"), { recursive: true });
  await mkdir(resolve(agentsDir, "rules"), { recursive: true });
  await mkdir(resolve(agentsDir, "templates"), { recursive: true });
  await mkdir(resolve(agentsDir, "validation"), { recursive: true });

  await writeFile(
    resolve(agentsDir, "skills", "fake-skill-a", "SKILL.md"),
    buildSkillMd("fake-skill-a"),
  );
  await writeFile(
    resolve(agentsDir, "skills", "fake-skill-b", "SKILL.md"),
    buildSkillMd("fake-skill-b"),
  );
  await writeFile(
    resolve(agentsDir, "agents", "fake-task-runner", "AGENT.md"),
    buildAgentMd("fake-task-runner", "Runs tasks", "## Instructions\nDo the task."),
  );
  await writeFile(
    resolve(agentsDir, "agents", "fake-review-runner", "AGENT.md"),
    buildAgentMd("fake-review-runner", "Reviews code", "## Instructions\nReview the code."),
  );
  await writeFile(resolve(agentsDir, "rules", "code-standards.md"), "# Standards");
  await writeFile(resolve(agentsDir, "validation", "enterprise-skills-check.md"), "# Validation");
  await writeFile(resolve(agentsDir, "templates", "prd-template.md"), "# PRD Template");
}

interface Fixture {
  tmp: string;
  targetRoot: string;
  agentsDir: string;
  packageRoot: string;
}

async function setupFixture(): Promise<Fixture> {
  const tmp = await createTmpDir();
  const targetRoot = resolve(tmp, "project");
  const packageRoot = resolve(tmp, "package");
  const agentsDir = resolve(packageRoot, ".agents");

  await mkdir(targetRoot, { recursive: true });
  await mkdir(agentsDir, { recursive: true });
  await buildFakeAgentsDir(agentsDir);
  await writeFile(resolve(packageRoot, "AGENTS.md"), "# Agents Guide");
  await writeFile(resolve(packageRoot, "CLAUDE.md"), "# Claude Guide");
  await writeFile(resolve(packageRoot, "CURSOR.md"), "# Cursor Guide");

  return { tmp, targetRoot, agentsDir, packageRoot };
}

function baseOpts(fixture: Fixture) {
  return {
    force: true,
    sourceAgentsDir: fixture.agentsDir,
    sourceAgentsMd: resolve(fixture.packageRoot, "AGENTS.md"),
    sourceClaudeMd: resolve(fixture.packageRoot, "CLAUDE.md"),
    sourceCursorMd: resolve(fixture.packageRoot, "CURSOR.md"),
  };
}

async function isSymlink(p: string): Promise<boolean> {
  try {
    const stat = await lstat(p);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
}

describe("runInstall — fluxo feliz", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await removeTmpDir(fixture.tmp);
  });

  it("copies .agents/ to target project", async () => {
    await runInstall(baseOpts(fixture));

    expect(await pathExists(resolve(fixture.targetRoot, ".agents", "skills", "fake-skill-a"))).toBe(true);
    expect(await pathExists(resolve(fixture.targetRoot, ".agents", "agents", "fake-task-runner", "AGENT.md"))).toBe(true);
  });

  it.skipIf(process.platform === "win32")(
    "creates symlinks for skills in .claude/skills/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".claude", "skills", "fake-skill-a"))).toBe(true);
      expect(await isSymlink(resolve(fixture.targetRoot, ".claude", "skills", "fake-skill-b"))).toBe(true);
    },
  );

  it.skipIf(process.platform === "win32")(
    "creates symlinks for agents in .claude/agents/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".claude", "agents", "fake-task-runner"))).toBe(true);
    },
  );

  it.skipIf(process.platform === "win32")(
    "creates directory symlinks for rules, templates, validation in .claude/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".claude", "rules"))).toBe(true);
      expect(await isSymlink(resolve(fixture.targetRoot, ".claude", "templates"))).toBe(true);
      expect(await isSymlink(resolve(fixture.targetRoot, ".claude", "validation"))).toBe(true);
    },
  );

  it.skipIf(process.platform === "win32")(
    "creates symlinks for skills in .codex/skills/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".codex", "skills", "fake-skill-a"))).toBe(true);
    },
  );

  it("generates .toml files for agents in .codex/agents/", async () => {
    await runInstall(baseOpts(fixture));

    const taskToml = resolve(fixture.targetRoot, ".codex", "agents", "fake-task-runner.toml");
    const reviewToml = resolve(fixture.targetRoot, ".codex", "agents", "fake-review-runner.toml");
    expect(await pathExists(taskToml)).toBe(true);
    expect(await pathExists(reviewToml)).toBe(true);

    const taskContent = await readFile(taskToml, "utf-8");
    expect(taskContent).toContain('name = "fake-task-runner"');
    expect(taskContent).toContain('developer_instructions = """');
  });

  it("creates AGENTS.md, CLAUDE.md and CURSOR.md in target root when absent", async () => {
    await runInstall(baseOpts(fixture));

    expect(await pathExists(resolve(fixture.targetRoot, "AGENTS.md"))).toBe(true);
    expect(await pathExists(resolve(fixture.targetRoot, "CLAUDE.md"))).toBe(true);
    expect(await pathExists(resolve(fixture.targetRoot, "CURSOR.md"))).toBe(true);

    const agentsContent = await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf-8");
    expect(agentsContent).toBe("# Agents Guide");

    const cursorContent = await readFile(resolve(fixture.targetRoot, "CURSOR.md"), "utf-8");
    expect(cursorContent).toBe("# Cursor Guide");
  });

  it("returns report with linked skills, agents and no errors", async () => {
    const report = await runInstall(baseOpts(fixture));

    expect(report.linkedSkills).toContain("fake-skill-a");
    expect(report.linkedSkills).toContain("fake-skill-b");
    expect(report.linkedAgents).toContain("fake-task-runner");
    expect(report.generatedTomls).toContain("fake-task-runner");
    expect(report.linkedCursorSkills).toContain("fake-skill-a");
    expect(report.linkedCursorAgents).toContain("fake-task-runner");
    expect(report.generatedMdc).toContain("code-standards");
    expect(report.errors).toHaveLength(0);
  });
});

describe("runInstall — camada Cursor", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await removeTmpDir(fixture.tmp);
  });

  it.skipIf(process.platform === "win32")(
    "creates symlinks for skills in .cursor/skills/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".cursor", "skills", "fake-skill-a"))).toBe(true);
      expect(await isSymlink(resolve(fixture.targetRoot, ".cursor", "skills", "fake-skill-b"))).toBe(true);
    },
  );

  it.skipIf(process.platform === "win32")(
    "creates symlinks for agents in .cursor/agents/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".cursor", "agents", "fake-task-runner"))).toBe(true);
      expect(await isSymlink(resolve(fixture.targetRoot, ".cursor", "agents", "fake-review-runner"))).toBe(true);
    },
  );

  it.skipIf(process.platform === "win32")(
    "creates directory symlinks for templates and validation in .cursor/",
    async () => {
      await runInstall(baseOpts(fixture));

      expect(await isSymlink(resolve(fixture.targetRoot, ".cursor", "templates"))).toBe(true);
      expect(await isSymlink(resolve(fixture.targetRoot, ".cursor", "validation"))).toBe(true);
      expect(await pathExists(resolve(fixture.targetRoot, ".cursor", "rules"))).toBe(true);
    },
  );

  it("generates .mdc files from .agents/rules/*.md", async () => {
    await runInstall(baseOpts(fixture));

    const mdcPath = resolve(fixture.targetRoot, ".cursor", "rules", "code-standards.mdc");
    expect(await pathExists(mdcPath)).toBe(true);

    const content = await readFile(mdcPath, "utf-8");
    expect(content).toContain("alwaysApply: true");
    expect(content).toContain("# Standards");
  });

  it("removes broken rule symlinks without cache and does not fail install", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const rulesDir = resolve(fixture.agentsDir, "rules");
    await symlink("/nonexistent/broken-rule-target.md", resolve(rulesDir, "broken-enterprise.md"));

    const report = await runInstall(baseOpts(fixture));

    expect(report.errors.some((e) => e.includes("broken-enterprise"))).toBe(false);
    expect(
      await pathExists(resolve(fixture.targetRoot, ".agents", "rules", "broken-enterprise.md")),
    ).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    expect(
      warnSpy.mock.calls.some((call) => String(call[0]).includes("broken-enterprise")),
    ).toBe(true);
    expect(await pathExists(resolve(fixture.targetRoot, ".cursor", "rules", "code-standards.mdc"))).toBe(
      true,
    );

    warnSpy.mockRestore();
  });

  it.skipIf(process.platform === "win32")(
    "repairs self-referencing enterprise rule symlinks from cache",
    async () => {
      const sourceRulesDir = resolve(fixture.agentsDir, "rules");
      await symlink("../../.agents/rules/react.md", resolve(sourceRulesDir, "react.md"));

      const cacheDir = resolve(
        fixture.targetRoot,
        ".claude/.enterprise-skills-cache/.agents/rules/frontend",
      );
      await mkdir(cacheDir, { recursive: true });
      await writeFile(
        resolve(cacheDir, "react.md"),
        "---\ndescription: React rules\npaths:\n  - src/**/*.tsx\n---\n# React\n",
      );

      const report = await runInstall(baseOpts(fixture));

      const targetRulesDir = resolve(fixture.targetRoot, ".agents", "rules");
      const reactRule = await readFile(resolve(targetRulesDir, "react.md"), "utf-8");
      expect(reactRule).toContain("# React");
      expect(report.errors.some((e) => e.includes("react"))).toBe(false);
      expect(await pathExists(resolve(fixture.targetRoot, ".cursor", "rules", "react.mdc"))).toBe(
        true,
      );
    },
  );

  it("prunes orphan .mdc files without corresponding .md source", async () => {
    const cursorRulesDir = resolve(fixture.targetRoot, ".cursor", "rules");
    await mkdir(cursorRulesDir, { recursive: true });
    await writeFile(
      resolve(cursorRulesDir, "removed-rule.mdc"),
      "---\ndescription: Orphan\nalwaysApply: false\n---\n# Orphan\n",
    );

    await runInstall(baseOpts(fixture));

    expect(await pathExists(resolve(cursorRulesDir, "removed-rule.mdc"))).toBe(false);
    expect(await pathExists(resolve(cursorRulesDir, "code-standards.mdc"))).toBe(true);
  });

  it.skipIf(process.platform === "win32")(
    "second runInstall does not recreate .cursor symlinks (mtime unchanged)",
    async () => {
      const opts = baseOpts(fixture);
      await runInstall(opts);

      const linkPath = resolve(fixture.targetRoot, ".cursor", "skills", "fake-skill-a");
      const statBefore = await lstat(linkPath);

      await runInstall(opts);

      const statAfter = await lstat(linkPath);
      expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
    },
  );

  it("second runInstall does not rewrite .mdc when content is unchanged", async () => {
    const opts = baseOpts(fixture);
    await runInstall(opts);

    const mdcPath = resolve(fixture.targetRoot, ".cursor", "rules", "code-standards.mdc");
    const statBefore = await lstat(mdcPath);

    await runInstall(opts);

    const statAfter = await lstat(mdcPath);
    expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
  });
});

describe("runInstall — idempotência", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await removeTmpDir(fixture.tmp);
  });

  it.skipIf(process.platform === "win32")(
    "second runInstall does not recreate symlinks (mtime unchanged)",
    async () => {
      const opts = baseOpts(fixture);
      await runInstall(opts);

      const linkPath = resolve(fixture.targetRoot, ".claude", "skills", "fake-skill-a");
      const statBefore = await lstat(linkPath);

      await runInstall(opts);

      const statAfter = await lstat(linkPath);
      expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
    },
  );

  it("second runInstall does not rewrite TOML when content is unchanged", async () => {
    const opts = baseOpts(fixture);
    await runInstall(opts);

    const tomlPath = resolve(fixture.targetRoot, ".codex", "agents", "fake-task-runner.toml");
    const statBefore = await lstat(tomlPath);

    await runInstall(opts);

    const statAfter = await lstat(tomlPath);
    expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
  });

  it("second runInstall does not overwrite existing AGENTS.md", async () => {
    const opts = baseOpts(fixture);
    await runInstall(opts);

    const agentsMdPath = resolve(fixture.targetRoot, "AGENTS.md");
    await writeFile(agentsMdPath, "# Custom Content");

    await runInstall(opts);

    const content = await readFile(agentsMdPath, "utf-8");
    expect(content).toBe("# Custom Content");
  });

  it("second runInstall does not overwrite existing CURSOR.md", async () => {
    const opts = baseOpts(fixture);
    await runInstall(opts);

    const cursorMdPath = resolve(fixture.targetRoot, "CURSOR.md");
    await writeFile(cursorMdPath, "# Custom Cursor Content");

    await runInstall(opts);

    const content = await readFile(cursorMdPath, "utf-8");
    expect(content).toBe("# Custom Cursor Content");
  });
});

describe("runInstall — falha localizada em .toml", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await removeTmpDir(fixture.tmp);
  });

  it("error in one agent TOML does not block generation of the other agents", async () => {
    const brokenAgentDir = resolve(fixture.agentsDir, "agents", "aaa-broken-agent");
    await mkdir(brokenAgentDir, { recursive: true });
    await writeFile(resolve(brokenAgentDir, "AGENT.md"), "no frontmatter here — malformed");

    const report = await runInstall(baseOpts(fixture));

    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toContain("aaa-broken-agent");
    expect(report.generatedTomls).toContain("fake-task-runner");
    expect(report.generatedTomls).toContain("fake-review-runner");

    expect(await pathExists(resolve(fixture.targetRoot, ".codex", "agents", "fake-task-runner.toml"))).toBe(true);
  });

  it("report contains descriptive error message for the failing agent", async () => {
    const brokenAgentDir = resolve(fixture.agentsDir, "agents", "bad-toml-agent");
    await mkdir(brokenAgentDir, { recursive: true });
    await writeFile(
      resolve(brokenAgentDir, "AGENT.md"),
      `---\nname: bad-toml-agent\ndescription: has triple quotes\n---\nbody with \"\"\" embedded`,
    );

    const report = await runInstall(baseOpts(fixture));

    expect(report.errors.some((e) => e.includes("bad-toml-agent"))).toBe(true);
    expect(report.generatedTomls).toContain("fake-task-runner");
  });

  it("successful agents are still listed in generatedTomls even when one fails", async () => {
    const brokenAgentDir = resolve(fixture.agentsDir, "agents", "zzz-broken");
    await mkdir(brokenAgentDir, { recursive: true });
    await writeFile(resolve(brokenAgentDir, "AGENT.md"), "malformed only");

    const report = await runInstall(baseOpts(fixture));

    expect(report.generatedTomls.length).toBeGreaterThanOrEqual(2);
    expect(report.errors).toHaveLength(1);
  });
});

describe("runInstall — migração recusada", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;
  let exitSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    exitSpy.mockRestore();
    vi.restoreAllMocks();
    await removeTmpDir(fixture.tmp);
  });

  it("aborts with process.exit(1) when migration is detected and user refuses", async () => {
    vi.spyOn(migrationModule, "detectMigration").mockResolvedValueOnce({
      realDirs: [join(fixture.targetRoot, ".claude", "skills")],
      filesPreserved: [],
      actions: ["1. Mover .claude/skills/"],
    });
    vi.spyOn(migrationModule, "confirmMigration").mockResolvedValueOnce(false);

    await expect(
      runInstall({
        sourceAgentsDir: fixture.agentsDir,
        sourceAgentsMd: resolve(fixture.packageRoot, "AGENTS.md"),
        sourceClaudeMd: resolve(fixture.packageRoot, "CLAUDE.md"),
      }),
    ).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("proceeds normally when migration is detected and user confirms", async () => {
    vi.spyOn(migrationModule, "detectMigration").mockResolvedValueOnce({
      realDirs: [join(fixture.targetRoot, ".claude", "skills")],
      filesPreserved: [],
      actions: ["1. Mover .claude/skills/"],
    });
    vi.spyOn(migrationModule, "confirmMigration").mockResolvedValueOnce(true);

    const report = await runInstall({
      sourceAgentsDir: fixture.agentsDir,
      sourceAgentsMd: resolve(fixture.packageRoot, "AGENTS.md"),
      sourceClaudeMd: resolve(fixture.packageRoot, "CLAUDE.md"),
    });

    expect(exitSpy).not.toHaveBeenCalled();
    expect(report.linkedSkills.length).toBeGreaterThan(0);
  });

  it("skips migration check entirely when opts.force is true", async () => {
    const detectSpy = vi.spyOn(migrationModule, "detectMigration");

    const report = await runInstall(baseOpts(fixture));

    expect(detectSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(report.errors).toHaveLength(0);
  });
});

describe("runInstall — preservação de settings*.json", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await removeTmpDir(fixture.tmp);
  });

  it.skipIf(process.platform === "win32")(
    "does not convert existing settings.json to a symlink",
    async () => {
      const claudeDir = resolve(fixture.targetRoot, ".claude");
      await mkdir(claudeDir, { recursive: true });
      await writeFile(resolve(claudeDir, "settings.json"), '{"theme":"dark"}');

      await runInstall(baseOpts(fixture));

      const settingsPath = resolve(claudeDir, "settings.json");
      const stat = await lstat(settingsPath);
      expect(stat.isSymbolicLink()).toBe(false);
      expect(stat.isFile()).toBe(true);

      const content = await readFile(settingsPath, "utf-8");
      expect(content).toBe('{"theme":"dark"}');
    },
  );

  it.skipIf(process.platform === "win32")(
    "does not convert existing settings.local.json to a symlink",
    async () => {
      const claudeDir = resolve(fixture.targetRoot, ".claude");
      await mkdir(claudeDir, { recursive: true });
      await writeFile(resolve(claudeDir, "settings.local.json"), '{"key":"val"}');

      await runInstall(baseOpts(fixture));

      const settingsPath = resolve(claudeDir, "settings.local.json");
      const stat = await lstat(settingsPath);
      expect(stat.isSymbolicLink()).toBe(false);
      expect(stat.isFile()).toBe(true);
    },
  );
});
