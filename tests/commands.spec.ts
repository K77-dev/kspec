import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import {
  mkdtemp,
  rm,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import fsExtra from "fs-extra";

const { pathExists } = fsExtra;

async function createTmpDir(): Promise<string> {
  return mkdtemp(resolve(tmpdir(), "kspec-commands-"));
}

async function removeTmpDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

function buildSkillMd(name: string): string {
  return `---\nname: ${name}\nversion: 1.0.0\ndescription: Skill ${name}\n---\n# ${name}\n`;
}

function buildAgentMd(name: string, description: string, body: string): string {
  return `---\nname: ${name}\nversion: 1.0.0\ndescription: ${description}\n---\n${body}`;
}

interface Fixture {
  tmp: string;
  targetRoot: string;
  packageRoot: string;
  agentsDir: string;
}

async function setupFixture(): Promise<Fixture> {
  const tmp = await createTmpDir();
  const targetRoot = resolve(tmp, "project");
  const packageRoot = resolve(tmp, "package");
  const agentsDir = resolve(packageRoot, ".agents");

  await mkdir(targetRoot, { recursive: true });
  await mkdir(resolve(agentsDir, "skills", "kspec-prd"), { recursive: true });
  await mkdir(resolve(agentsDir, "agents", "kspec-task-runner"), { recursive: true });
  await mkdir(resolve(agentsDir, "rules"), { recursive: true });
  await mkdir(resolve(agentsDir, "templates"), { recursive: true });
  await mkdir(resolve(agentsDir, "validation"), { recursive: true });

  await writeFile(
    resolve(agentsDir, "skills", "kspec-prd", "SKILL.md"),
    buildSkillMd("kspec-prd"),
  );
  await writeFile(
    resolve(agentsDir, "agents", "kspec-task-runner", "AGENT.md"),
    buildAgentMd("kspec-task-runner", "Runs tasks", "## Instructions\nDo the task."),
  );
  await writeFile(resolve(agentsDir, "rules", "code-standards.md"), "# Standards");
  await writeFile(resolve(agentsDir, "templates", "prd-template.md"), "# PRD");
  await writeFile(resolve(agentsDir, "validation", "enterprise-skills-check.md"), "# Validation");

  await writeFile(resolve(packageRoot, "AGENTS.md"), "# Agents Guide");
  await writeFile(resolve(packageRoot, "CLAUDE.md"), "# Claude Guide");

  return { tmp, targetRoot, packageRoot, agentsDir };
}

describe("runInit", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    vi.restoreAllMocks();
    await removeTmpDir(fixture.tmp);
  });

  it("delegates to runInstall and generates .agents/ in target project", async () => {
    const installModule = await import("../src/lib/install.js");
    const installSpy = vi.spyOn(installModule, "runInstall").mockResolvedValueOnce({
      linkedSkills: ["kspec-prd"],
      linkedAgents: ["kspec-task-runner"],
      generatedTomls: ["kspec-task-runner"],
      linkedCursorSkills: ["kspec-prd"],
      linkedCursorAgents: ["kspec-task-runner"],
      generatedMdc: ["code-standards"],
      errors: [],
    });

    const { runInit } = await import("../src/commands/init.js?v=1");
    await runInit({ force: true });

    expect(installSpy).toHaveBeenCalledOnce();
    expect(installSpy).toHaveBeenCalledWith({ force: true });
  });

  it("passes force=false to runInstall when not forced", async () => {
    const installModule = await import("../src/lib/install.js");
    const installSpy = vi.spyOn(installModule, "runInstall").mockResolvedValueOnce({
      linkedSkills: [],
      linkedAgents: [],
      generatedTomls: [],
      linkedCursorSkills: [],
      linkedCursorAgents: [],
      generatedMdc: [],
      errors: [],
    });

    const { runInit } = await import("../src/commands/init.js?v=2");
    await runInit({ force: false });

    expect(installSpy).toHaveBeenCalledWith({ force: false });
  });

  it("passes force=undefined to runInstall when no options provided", async () => {
    const installModule = await import("../src/lib/install.js");
    const installSpy = vi.spyOn(installModule, "runInstall").mockResolvedValueOnce({
      linkedSkills: [],
      linkedAgents: [],
      generatedTomls: [],
      linkedCursorSkills: [],
      linkedCursorAgents: [],
      generatedMdc: [],
      errors: [],
    });

    const { runInit } = await import("../src/commands/init.js?v=3");
    await runInit();

    expect(installSpy).toHaveBeenCalledWith({ force: undefined });
  });

  it("runs end-to-end and creates project structure", async () => {
    vi.resetModules();
    const pathsModule = await import("../src/utils/paths.js");
    vi.spyOn(pathsModule, "getAgentsSourceDir").mockReturnValue(fixture.agentsDir);
    vi.spyOn(pathsModule, "getAgentsMdSource").mockReturnValue(resolve(fixture.packageRoot, "AGENTS.md"));
    vi.spyOn(pathsModule, "getClaudeMdSource").mockReturnValue(resolve(fixture.packageRoot, "CLAUDE.md"));

    const { runInit } = await import("../src/commands/init.js?v=e2e");
    await runInit({ force: true });

    expect(await pathExists(resolve(fixture.targetRoot, ".agents"))).toBe(true);
    expect(await pathExists(resolve(fixture.targetRoot, "AGENTS.md"))).toBe(true);
    expect(await pathExists(resolve(fixture.targetRoot, "CLAUDE.md"))).toBe(true);
  });
});

describe("runUpdate", () => {
  let fixture: Fixture;
  let cwdSpy: MockInstance;

  beforeEach(async () => {
    fixture = await setupFixture();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(fixture.targetRoot);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    vi.restoreAllMocks();
    await removeTmpDir(fixture.tmp);
  });

  it("delegates to runInstall with force=true for idempotent update", async () => {
    const installModule = await import("../src/lib/install.js");
    const installSpy = vi.spyOn(installModule, "runInstall").mockResolvedValueOnce({
      linkedSkills: ["kspec-prd"],
      linkedAgents: ["kspec-task-runner"],
      generatedTomls: ["kspec-task-runner"],
      linkedCursorSkills: ["kspec-prd"],
      linkedCursorAgents: ["kspec-task-runner"],
      generatedMdc: ["code-standards"],
      errors: [],
    });

    const { runUpdate } = await import("../src/commands/update.js?v=1");
    await runUpdate();

    expect(installSpy).toHaveBeenCalledOnce();
    expect(installSpy).toHaveBeenCalledWith({ force: true });
  });

  it("passes force=true so that migration check is skipped on update", async () => {
    const installModule = await import("../src/lib/install.js");
    const installSpy = vi.spyOn(installModule, "runInstall").mockResolvedValueOnce({
      linkedSkills: [],
      linkedAgents: [],
      generatedTomls: [],
      linkedCursorSkills: [],
      linkedCursorAgents: [],
      generatedMdc: [],
      errors: [],
    });

    const { runUpdate } = await import("../src/commands/update.js?v=2");
    await runUpdate();

    const callArg = installSpy.mock.calls[0][0];
    expect(callArg).toHaveProperty("force", true);
  });

  it("is idempotent: two sequential runUpdate calls produce same result", async () => {
    vi.resetModules();
    const pathsModule = await import("../src/utils/paths.js");
    vi.spyOn(pathsModule, "getAgentsSourceDir").mockReturnValue(fixture.agentsDir);
    vi.spyOn(pathsModule, "getAgentsMdSource").mockReturnValue(resolve(fixture.packageRoot, "AGENTS.md"));
    vi.spyOn(pathsModule, "getClaudeMdSource").mockReturnValue(resolve(fixture.packageRoot, "CLAUDE.md"));

    const { runUpdate } = await import("../src/commands/update.js?v=idempotent");

    await runUpdate();
    const tomlPath = resolve(fixture.targetRoot, ".codex", "agents", "kspec-task-runner.toml");
    const { lstat } = await import("node:fs/promises");
    const statBefore = await lstat(tomlPath);

    await runUpdate();
    const statAfter = await lstat(tomlPath);

    expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
  });

  it("runs end-to-end and preserves existing AGENTS.md", async () => {
    vi.resetModules();
    const pathsModule = await import("../src/utils/paths.js");
    vi.spyOn(pathsModule, "getAgentsSourceDir").mockReturnValue(fixture.agentsDir);
    vi.spyOn(pathsModule, "getAgentsMdSource").mockReturnValue(resolve(fixture.packageRoot, "AGENTS.md"));
    vi.spyOn(pathsModule, "getClaudeMdSource").mockReturnValue(resolve(fixture.packageRoot, "CLAUDE.md"));

    const agentsMdPath = resolve(fixture.targetRoot, "AGENTS.md");
    await writeFile(agentsMdPath, "# Custom AGENTS");

    const { runUpdate } = await import("../src/commands/update.js?v=e2e");
    await runUpdate();

    const { readFile } = await import("node:fs/promises");
    const content = await readFile(agentsMdPath, "utf-8");
    expect(content).toBe("# Custom AGENTS");
  });
});
