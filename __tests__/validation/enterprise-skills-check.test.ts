import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

describe("enterprise-skills-check.md", () => {
  const filePath = resolve(ROOT, ".claude/validation/enterprise-skills-check.md");
  let content: string;

  beforeAll(() => {
    content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  });

  it("should exist at .claude/validation/enterprise-skills-check.md", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("should contain Step 1: Read Local Lock File", () => {
    expect(content).toContain("Step 1");
    expect(content).toContain("enterprise-skills-lock.json");
    expect(content).toContain("remote.url");
    expect(content).toContain("remote.branch");
  });

  it("should contain Step 2: Fetch Remote Repository with git clone/pull", () => {
    expect(content).toContain("Step 2");
    expect(content).toContain("git clone --depth 1");
    expect(content).toContain("git -C");
    expect(content).toContain("pull --ff-only");
    expect(content).toContain(".enterprise-skills-cache");
  });

  it("should contain Step 3: Read Remote Lock File", () => {
    expect(content).toContain("Step 3");
    expect(content).toContain("skills-lock.json");
    expect(content).toContain("computedHash");
  });

  it("should contain Step 4: Compare Hashes", () => {
    expect(content).toContain("Step 4");
    expect(content).toContain("missing");
    expect(content).toContain("outdated");
    expect(content).toContain("removed");
  });

  it("should contain Step 5: Execute Actions (install, update, remove)", () => {
    expect(content).toContain("Step 5");
    expect(content).toContain(".agents/skills/");
    expect(content).toContain(".claude/skills/");
    expect(content).toContain("ln -sfn");
    expect(content).toContain("cp -r");
    expect(content).toContain("rm -rf");
  });

  it("should contain Step 6: Update Local Lock File", () => {
    expect(content).toContain("Step 6");
    expect(content).toContain("lastChecked");
    expect(content).toContain("installedAt");
  });

  it("should contain Step 7: Fallback Offline", () => {
    expect(content).toContain("Step 7");
    expect(content).toContain("Fallback");
  });

  it("should contain the standard status messages", () => {
    expect(content).toContain("Skills empresariais validadas");
    expect(content).toContain("Instalando");
    expect(content).toContain("Atualizando");
    expect(content).toContain("erro de rede");
    expect(content).toContain("Skills empresariais obrigatórias não encontradas");
  });

  it("should be provider-agnostic (no gh api or provider-specific commands)", () => {
    expect(content).not.toContain("gh api");
    expect(content).not.toContain("az repos");
    expect(content).toContain("provider-agnostic");
  });

  it("should reference blocking execution when skills are absent and offline", () => {
    expect(content).toContain("BLOCK");
    expect(content).toContain("ALLOW");
  });
});

describe("enterprise-skills-lock.json", () => {
  const filePath = resolve(ROOT, "enterprise-skills-lock.json");

  it("should exist at project root", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("should be valid JSON", () => {
    const raw = readFileSync(filePath, "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("should have version field set to 1", () => {
    const lock = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(lock.version).toBe(1);
  });

  it("should have remote field with url, branch, and provider", () => {
    const lock = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(lock.remote).toBeDefined();
    expect(lock.remote.url).toBe("https://github.com/K77-dev/enterprise-platform-skills.git");
    expect(lock.remote.branch).toBe("main");
    expect(lock.remote.provider).toBe("github");
  });

  it("should have lastChecked field set to null initially", () => {
    const lock = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(lock.lastChecked).toBeNull();
  });

  it("should have empty skills object initially", () => {
    const lock = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(lock.skills).toBeDefined();
    expect(typeof lock.skills).toBe("object");
    expect(Object.keys(lock.skills)).toHaveLength(0);
  });

  it("should contain exactly the required top-level fields", () => {
    const lock = JSON.parse(readFileSync(filePath, "utf-8"));
    const keys = Object.keys(lock).sort();
    expect(keys).toEqual(["lastChecked", "remote", "skills", "version"]);
  });
});

describe(".gitignore", () => {
  const filePath = resolve(ROOT, ".gitignore");

  it("should exist", () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it("should contain .claude/.enterprise-skills-cache/", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain(".claude/.enterprise-skills-cache/");
  });

  it("should NOT contain enterprise-skills-lock.json", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toContain("enterprise-skills-lock.json");
  });
});
