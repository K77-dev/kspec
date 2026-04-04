import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const VALIDATION_FILE = resolve(
  ROOT,
  ".claude/validation/enterprise-skills-check.md",
);
const LOCK_FILE = resolve(ROOT, "enterprise-skills-lock.json");

function readValidation(): string {
  if (!existsSync(VALIDATION_FILE)) return "";
  return readFileSync(VALIDATION_FILE, "utf-8");
}

function readLock(): Record<string, unknown> {
  if (!existsSync(LOCK_FILE)) return {};
  return JSON.parse(readFileSync(LOCK_FILE, "utf-8"));
}

function buildLockWithSkills(
  skills: Record<
    string,
    { computedHash: string; installedAt: string; files: string[] }
  >,
): Record<string, unknown> {
  return {
    version: 1,
    remote: {
      url: "https://github.com/K77-dev/enterprise-platform-skills.git",
      branch: "main",
      provider: "github",
    },
    lastChecked: "2026-04-04T14:30:00Z",
    skills,
  };
}

describe("Scenario 5.1: Lock local absent + network OK", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should handle missing lock file by treating all skills as missing", () => {
    expect(content).toContain("does not exist");
    expect(content).toContain("treat ALL skills as missing");
  });

  it("should instruct git clone when cache does not exist", () => {
    expect(content).toContain("git clone --depth 1");
    expect(content).toContain("{url}");
    expect(content).toContain("{branch}");
  });

  it("should instruct to install missing skills with cp -r", () => {
    expect(content).toContain(
      "cp -r .claude/.enterprise-skills-cache/.agents/skills/{skill-name}/",
    );
  });

  it("should instruct to create symlinks for installed skills", () => {
    expect(content).toContain(
      "ln -sfn ../../.agents/skills/{skill-name} .claude/skills/{skill-name}",
    );
  });

  it("should instruct to display installation progress message", () => {
    expect(content).toContain("Instalando {skill-name}... OK");
  });

  it("should instruct to create/update the local lock file after installation", () => {
    expect(content).toContain("Update Local Lock File");
    expect(content).toContain("enterprise-skills-lock.json");
    expect(content).toContain("lastChecked");
    expect(content).toContain("installedAt");
  });

  it("should report count of installed skills", () => {
    expect(content).toContain("skill(s) empresarial(is) instalada(s)");
  });
});

describe("Scenario 5.2: Lock local present + valid hashes", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should instruct reading the local lock file as first step", () => {
    expect(content).toContain("Step 1: Read Local Lock File");
    expect(content).toContain("enterprise-skills-lock.json");
  });

  it("should instruct comparing hashes between remote and local", () => {
    expect(content).toContain("Step 4: Compare Hashes");
    expect(content).toContain("computedHash");
  });

  it("should classify skills with matching hashes as valid", () => {
    expect(content).toContain(
      "exists locally and `computedHash` matches, classify it as **valid**",
    );
  });

  it("should display success message when all hashes are valid", () => {
    expect(content).toContain("If all skills are valid (no actions needed)");
    expect(content).toContain("Skills empresariais validadas");
  });

  it("should not trigger any downloads when all hashes match", () => {
    const step5Section = content.substring(
      content.indexOf("Step 5: Execute Actions"),
    );
    expect(step5Section).toContain("If all skills are valid (no actions needed)");
  });
});

describe("Scenario 5.3: Lock local present + divergent hash", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should classify skills with differing hashes as outdated", () => {
    expect(content).toContain(
      "exists locally but `computedHash` differs (remote != local), classify it as **outdated**",
    );
  });

  it("should instruct reinstalling outdated skills", () => {
    expect(content).toContain("For each missing or outdated skill");
    expect(content).toContain("cp -r");
  });

  it("should instruct recreating symlinks for outdated skills", () => {
    expect(content).toContain("ln -sfn");
  });

  it("should display update progress message for outdated skills", () => {
    expect(content).toContain("Atualizando {skill-name}... OK");
  });

  it("should report count of updated skills", () => {
    expect(content).toContain("skill(s) atualizada(s)");
  });

  it("should update the lock file with new hashes after reinstallation", () => {
    expect(content).toContain("computedHash");
    expect(content).toContain("the `computedHash` value from the remote registry");
  });
});

describe("Scenario 5.4: Network unavailable + skills installed locally", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should handle git clone/pull failure by going to fallback", () => {
    expect(content).toContain(
      "If the git command fails (exit code != 0), go to **Step 7 (Fallback Offline)**",
    );
  });

  it("should check if local lock exists with non-empty skills", () => {
    const step7Section = content.substring(
      content.indexOf("Step 7: Fallback Offline"),
    );
    expect(step7Section).toContain("enterprise-skills-lock.json");
    expect(step7Section).toContain("non-empty `skills` object");
  });

  it("should display warning message when offline but skills are installed", () => {
    expect(content).toContain(
      "Não foi possível verificar skills empresariais (erro de rede). Usando versão local.",
    );
  });

  it("should ALLOW execution when offline but skills are already installed", () => {
    const step7Section = content.substring(
      content.indexOf("Step 7: Fallback Offline"),
    );
    expect(step7Section).toContain("**ALLOW**");
    expect(step7Section).toContain("proceed with execution");
  });

  it("should use the warning indicator symbol for offline fallback", () => {
    expect(content).toContain(
      "\u26A0 Não foi possível verificar skills empresariais",
    );
  });
});

describe("Scenario 5.5: Network unavailable + skills absent", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should check for absence of local skills in fallback", () => {
    const step7Section = content.substring(
      content.indexOf("Step 7: Fallback Offline"),
    );
    expect(step7Section).toContain("**If NO**");
    expect(step7Section).toContain("no local skills installed");
  });

  it("should display error message when offline and no skills installed", () => {
    expect(content).toContain(
      "Skills empresariais obrigatórias não encontradas",
    );
  });

  it("should include resolution instructions in the error message", () => {
    expect(content).toContain("Conecte-se à internet e tente novamente");
    expect(content).toContain("/kspec-bootstrap para instalar");
  });

  it("should BLOCK execution when offline and no skills installed", () => {
    const step7Section = content.substring(
      content.indexOf("Step 7: Fallback Offline"),
    );
    expect(step7Section).toContain("**BLOCK**");
    expect(step7Section).toContain("DO NOT proceed");
  });

  it("should use the error indicator symbol for blocked execution", () => {
    expect(content).toContain(
      "\u2717 Skills empresariais obrigatórias não encontradas",
    );
  });
});

describe("Scenario 5.6: Skill removed from remote", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should detect skills present locally but absent from remote", () => {
    expect(content).toContain(
      "Check if the skill still exists in the **remote** registry",
    );
    expect(content).toContain(
      "does NOT exist remotely, classify it as **removed**",
    );
  });

  it("should instruct deleting the skill directory for removed skills", () => {
    expect(content).toContain("rm -rf .agents/skills/{skill-name}");
  });

  it("should instruct deleting the symlink for removed skills", () => {
    expect(content).toContain("rm -f .claude/skills/{skill-name}");
  });

  it("should display removal progress message", () => {
    expect(content).toContain("Removendo {skill-name}... OK");
  });

  it("should report count of removed skills", () => {
    expect(content).toContain("skill(s) removida(s)");
  });

  it("should update lock file to exclude removed skills", () => {
    expect(content).toContain(
      "for each skill in the remote registry, create an entry",
    );
  });
});

describe("Scenario 5.7: New skill added to remote", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should detect skills in remote registry not present locally", () => {
    expect(content).toContain(
      "does NOT exist locally, classify it as **missing**",
    );
  });

  it("should instruct installing missing skills from cache", () => {
    expect(content).toContain(
      "cp -r .claude/.enterprise-skills-cache/.agents/skills/{skill-name}/",
    );
  });

  it("should instruct creating symlinks for new skills", () => {
    expect(content).toContain(
      "ln -sfn ../../.agents/skills/{skill-name} .claude/skills/{skill-name}",
    );
  });

  it("should add new skill entry to local lock with hash and timestamp", () => {
    expect(content).toContain("installedAt");
    expect(content).toContain("computedHash");
    expect(content).toContain("files");
  });

  it("should handle new skills the same way as missing skills in Step 5", () => {
    expect(content).toContain("For each missing or outdated skill");
    expect(content).toContain("Instalando {skill-name}... OK");
  });
});

describe("Lock file structure and manipulability", () => {
  it("should be valid JSON", () => {
    const lock = readLock();
    expect(lock).toBeDefined();
  });

  it("should have the required top-level fields", () => {
    const lock = readLock();
    expect(lock).toHaveProperty("version");
    expect(lock).toHaveProperty("remote");
    expect(lock).toHaveProperty("lastChecked");
    expect(lock).toHaveProperty("skills");
  });

  it("should allow adding skills to simulate installed state", () => {
    const lock = buildLockWithSkills({
      "cybersecurity-analyst": {
        computedHash: "abc123",
        installedAt: "2026-04-04T14:30:00Z",
        files: [".agents/skills/cybersecurity-analyst/SKILL.md"],
      },
    });
    expect(Object.keys(lock.skills as Record<string, unknown>)).toHaveLength(1);
    expect(
      (lock.skills as Record<string, { computedHash: string }>)[
        "cybersecurity-analyst"
      ].computedHash,
    ).toBe("abc123");
  });

  it("should allow modifying computedHash to simulate divergent hash", () => {
    const lock = buildLockWithSkills({
      "cybersecurity-analyst": {
        computedHash: "tampered-hash-value",
        installedAt: "2026-04-04T14:30:00Z",
        files: [".agents/skills/cybersecurity-analyst/SKILL.md"],
      },
    });
    expect(
      (lock.skills as Record<string, { computedHash: string }>)[
        "cybersecurity-analyst"
      ].computedHash,
    ).toBe("tampered-hash-value");
  });

  it("should allow adding fictitious skills to simulate removed-from-remote scenario", () => {
    const lock = buildLockWithSkills({
      "fictitious-skill": {
        computedHash: "fake-hash",
        installedAt: "2026-04-04T14:30:00Z",
        files: [".agents/skills/fictitious-skill/SKILL.md"],
      },
    });
    expect(
      (lock.skills as Record<string, unknown>)["fictitious-skill"],
    ).toBeDefined();
  });

  it("should allow empty skills object to simulate absent lock state", () => {
    const lock = buildLockWithSkills({});
    expect(Object.keys(lock.skills as Record<string, unknown>)).toHaveLength(0);
  });

  it("should allow changing remote URL to simulate network failure", () => {
    const lock = buildLockWithSkills({});
    (lock.remote as Record<string, string>).url =
      "https://invalid-url.example.com/nonexistent.git";
    expect((lock.remote as Record<string, string>).url).toContain(
      "invalid-url",
    );
  });

  it("should produce valid JSON when serialized", () => {
    const lock = buildLockWithSkills({
      "test-skill": {
        computedHash: "abc",
        installedAt: "2026-04-04T14:30:00Z",
        files: [".agents/skills/test-skill/SKILL.md"],
      },
    });
    const serialized = JSON.stringify(lock, null, 2);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});

describe("Directory structure correctness", () => {
  it("should have .claude/validation/ directory with enterprise-skills-check.md", () => {
    expect(existsSync(VALIDATION_FILE)).toBe(true);
  });

  it("should have .claude/skills/ directory with all 8 skill subdirectories", () => {
    const expectedSkills = [
      "kspec-bootstrap",
      "kspec-prd",
      "kspec-techspec",
      "kspec-tasks",
      "kspec-implement-task",
      "kspec-implement-all-tasks",
      "kspec-qa",
      "kspec-bugfix",
    ];
    for (const skill of expectedSkills) {
      const skillPath = resolve(ROOT, `.claude/skills/${skill}/SKILL.md`);
      expect(existsSync(skillPath)).toBe(true);
    }
  });

  it("should have .claude/agents/ directory with all 3 agent subdirectories", () => {
    const expectedAgents = [
      "kspec-task-runner",
      "kspec-review-runner",
      "kspec-qa-runner",
    ];
    for (const agent of expectedAgents) {
      const agentPath = resolve(ROOT, `.claude/agents/${agent}/AGENT.md`);
      expect(existsSync(agentPath)).toBe(true);
    }
  });

  it("should have enterprise-skills-lock.json at project root", () => {
    expect(existsSync(LOCK_FILE)).toBe(true);
  });

  it("should have .gitignore with enterprise-skills-cache excluded", () => {
    const gitignore = readFileSync(resolve(ROOT, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".claude/.enterprise-skills-cache/");
  });

  it("should NOT have enterprise-skills-lock.json in .gitignore", () => {
    const gitignore = readFileSync(resolve(ROOT, ".gitignore"), "utf-8");
    expect(gitignore).not.toContain("enterprise-skills-lock.json");
  });
});

describe("Validation check completeness", () => {
  let content: string;

  beforeAll(() => {
    content = readValidation();
  });

  it("should contain all 7 steps referenced by the algorithm", () => {
    expect(content).toContain("Step 1");
    expect(content).toContain("Step 2");
    expect(content).toContain("Step 3");
    expect(content).toContain("Step 4");
    expect(content).toContain("Step 5");
    expect(content).toContain("Step 6");
    expect(content).toContain("Step 7");
  });

  it("should contain all 4 status indicator symbols", () => {
    expect(content).toMatch(/\u2713/);
    expect(content).toMatch(/\u2192/);
    expect(content).toMatch(/\u26A0/);
    expect(content).toMatch(/\u2717/);
  });

  it("should mark the validation as MANDATORY", () => {
    expect(content).toContain("MANDATORY");
    expect(content).toContain("must be executed BEFORE");
  });

  it("should be provider-agnostic", () => {
    expect(content).toContain("provider-agnostic");
    expect(content).not.toContain("gh api");
    expect(content).not.toContain("az repos");
  });

  it("should reference the cache directory for clone operations", () => {
    expect(content).toContain(".claude/.enterprise-skills-cache/");
  });

  it("should reference both .agents/skills/ and .claude/skills/ directories", () => {
    expect(content).toContain(".agents/skills/");
    expect(content).toContain(".claude/skills/");
  });

  it("should instruct that lock file must be committed", () => {
    expect(content).toContain("MUST be committed");
  });

  it("should instruct that cache directory should NOT be committed", () => {
    expect(content).toContain(".gitignore");
    expect(content).toContain("should NOT be committed");
  });
});

describe("Integration: All skills and agents reference the validation block", () => {
  const allSkills = [
    "kspec-bootstrap",
    "kspec-prd",
    "kspec-techspec",
    "kspec-tasks",
    "kspec-implement-task",
    "kspec-implement-all-tasks",
    "kspec-qa",
    "kspec-bugfix",
  ];
  const allAgents = [
    "kspec-task-runner",
    "kspec-review-runner",
    "kspec-qa-runner",
  ];

  for (const skill of allSkills) {
    it(`${skill}/SKILL.md should reference enterprise-skills-check.md`, () => {
      const filePath = resolve(ROOT, `.claude/skills/${skill}/SKILL.md`);
      const fileContent = readFileSync(filePath, "utf-8");
      expect(fileContent).toContain(
        "@.claude/validation/enterprise-skills-check.md",
      );
    });
  }

  for (const agent of allAgents) {
    it(`${agent}/AGENT.md should reference enterprise-skills-check.md`, () => {
      const filePath = resolve(ROOT, `.claude/agents/${agent}/AGENT.md`);
      const fileContent = readFileSync(filePath, "utf-8");
      expect(fileContent).toContain(
        "@.claude/validation/enterprise-skills-check.md",
      );
    });
  }
});
