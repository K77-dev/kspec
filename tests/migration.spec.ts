import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { detectMigration } from "../src/lib/migration.js";

async function createTmpDir(): Promise<string> {
  return mkdtemp(resolve(tmpdir(), "kspec-migration-"));
}

async function removeTmpDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

describe("detectMigration", () => {
  let tmp: string;
  let claudeDir: string;
  let cursorDir: string;

  beforeEach(async () => {
    tmp = await createTmpDir();
    claudeDir = resolve(tmp, ".claude");
    cursorDir = resolve(tmp, ".cursor");
    await mkdir(claudeDir, { recursive: true });
  });

  afterEach(async () => {
    await removeTmpDir(tmp);
  });

  it("detects real .claude/skills/ directory and populates realDirs", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await writeFile(resolve(claudeDir, "skills", "dummy.md"), "# dummy");

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.realDirs).toHaveLength(1);
    expect(plan!.realDirs[0]).toContain("skills");
  });

  it("detects multiple real subdirs in .claude/", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await mkdir(resolve(claudeDir, "agents"), { recursive: true });
    await mkdir(resolve(claudeDir, "rules"), { recursive: true });

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.realDirs).toHaveLength(3);
  });

  it("returns null when all subdirs are already symlinks", async () => {
    const agentsBase = resolve(tmp, ".agents");
    await mkdir(resolve(agentsBase, "skills"), { recursive: true });
    await mkdir(resolve(agentsBase, "agents"), { recursive: true });
    await symlink(
      resolve(agentsBase, "skills"),
      resolve(claudeDir, "skills"),
    );
    await symlink(
      resolve(agentsBase, "agents"),
      resolve(claudeDir, "agents"),
    );

    const plan = await detectMigration(claudeDir);

    expect(plan).toBeNull();
  });

  it("returns null when .claude/ has no recognized subdirs at all", async () => {
    const plan = await detectMigration(claudeDir);
    expect(plan).toBeNull();
  });

  it("includes settings.json in filesPreserved when it exists", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await writeFile(resolve(claudeDir, "settings.json"), "{}");

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.filesPreserved).toContain("settings.json");
  });

  it("includes settings.local.json in filesPreserved when it exists", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await writeFile(resolve(claudeDir, "settings.local.json"), "{}");

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.filesPreserved).toContain("settings.local.json");
  });

  it("includes both settings files in filesPreserved when both exist", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await writeFile(resolve(claudeDir, "settings.json"), "{}");
    await writeFile(resolve(claudeDir, "settings.local.json"), "{}");

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.filesPreserved).toContain("settings.json");
    expect(plan!.filesPreserved).toContain("settings.local.json");
    expect(plan!.filesPreserved).toHaveLength(2);
  });

  it("has empty filesPreserved when no settings files exist", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.filesPreserved).toHaveLength(0);
  });

  it("generates numbered actions for each real dir", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.actions).toHaveLength(2);
    expect(plan!.actions[0]).toMatch(/^1\./);
    expect(plan!.actions[1]).toMatch(/^2\./);
    expect(plan!.actions[0]).toContain(".claude/skills/");
    expect(plan!.actions[1]).toContain(".claude/skills/");
  });

  it("generates actions with move and symlink steps for each real dir", async () => {
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await mkdir(resolve(claudeDir, "rules"), { recursive: true });

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.actions).toHaveLength(4);
    expect(plan!.actions[0]).toContain("Mover");
    expect(plan!.actions[1]).toContain("Criar symlink");
    expect(plan!.actions[2]).toContain("Mover");
    expect(plan!.actions[3]).toContain("Criar symlink");
  });

  it("ignores symlink subdirs and only collects real dirs", async () => {
    const agentsBase = resolve(tmp, ".agents");
    await mkdir(resolve(agentsBase, "rules"), { recursive: true });
    await mkdir(resolve(claudeDir, "skills"), { recursive: true });
    await symlink(
      resolve(agentsBase, "rules"),
      resolve(claudeDir, "rules"),
    );

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.realDirs).toHaveLength(1);
    expect(plan!.realDirs[0]).toContain("skills");
  });

  it("detects real .cursor/skills/ directory and populates realDirs", async () => {
    await mkdir(resolve(cursorDir, "skills"), { recursive: true });
    await writeFile(resolve(cursorDir, "skills", "dummy.md"), "# dummy");

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.realDirs).toHaveLength(1);
    expect(plan!.realDirs[0]).toContain(".cursor/skills");
    expect(plan!.actions[0]).toContain(".cursor/skills/");
  });

  it("does not trigger migration plan for real .cursor/rules/ directory", async () => {
    await mkdir(resolve(cursorDir, "rules"), { recursive: true });
    await writeFile(resolve(cursorDir, "rules", "code-standards.mdc"), "---\nalwaysApply: true\n---\n");

    const plan = await detectMigration(claudeDir);

    expect(plan).toBeNull();
  });

  it("detects real dirs in both .claude/ and .cursor/", async () => {
    await mkdir(resolve(claudeDir, "agents"), { recursive: true });
    await mkdir(resolve(cursorDir, "templates"), { recursive: true });

    const plan = await detectMigration(claudeDir);

    expect(plan).not.toBeNull();
    expect(plan!.realDirs).toHaveLength(2);
    expect(plan!.realDirs.some((d) => d.includes(".claude/agents"))).toBe(true);
    expect(plan!.realDirs.some((d) => d.includes(".cursor/templates"))).toBe(true);
    expect(plan!.actions).toHaveLength(4);
  });
});
