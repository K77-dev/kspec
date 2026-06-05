import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
const SKILLS_DIR = resolve(ROOT, ".agents/skills");
const AGENTS_DIR = resolve(ROOT, ".agents/agents");

function readSkill(name: string): string {
  const path = resolve(SKILLS_DIR, name, "SKILL.md");
  expect(existsSync(path), `${name}/SKILL.md must exist`).toBe(true);
  return readFileSync(path, "utf-8");
}

const KSPEC_SKILLS = [
  "kspec-ideia",
  "kspec-prd",
  "kspec-techspec",
  "kspec-tasks",
  "kspec-implement",
  "kspec-qa",
  "kspec-pr-review",
  "kspec-bugfix",
  "kspec-bootstrap",
  "kspec-version",
];

const SUBAGENT_TYPES = [
  "kspec-task-runner",
  "kspec-review-runner",
  "kspec-qa-runner",
];

const ORCHESTRATION_SKILLS = ["kspec-implement", "kspec-qa", "kspec-version"];

describe("skills coherence (REQ-005 / task 8.0)", () => {
  it("lists exactly 10 invocable kspec-* skills in .agents/skills/", () => {
    const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("kspec-"))
      .map((d) => d.name)
      .sort();

    expect(dirs).toEqual(KSPEC_SKILLS.sort());
  });

  it("kspec-version prints all three supported platforms", () => {
    const content = readSkill("kspec-version");
    expect(content).toContain(
      "Plataformas suportadas: Claude Code, OpenAI Codex CLI, Cursor"
    );
  });

  it("kspec-implement documents Task tool delegation with subagent_type and fallback", () => {
    const content = readSkill("kspec-implement");

    expect(content).toMatch(/Task tool/i);
    expect(content).toContain('subagent_type: "kspec-task-runner"');
    expect(content).toContain('subagent_type: "kspec-review-runner"');
    expect(content).toMatch(/fallback/i);
    expect(content).toMatch(/inline/i);
    expect(content).toMatch(/Task tool indisponível/);
  });

  it("kspec-qa documents Task tool delegation with subagent_type and fallback", () => {
    const content = readSkill("kspec-qa");

    expect(content).toMatch(/Task tool/i);
    expect(content).toContain('subagent_type: "kspec-qa-runner"');
    expect(content).toMatch(/fallback/i);
    expect(content).toMatch(/inline/i);
    expect(content).toMatch(/Task tool indisponível/);
  });

  it("orchestration skills keep @.agents/ refs canonical", () => {
    for (const name of ["kspec-implement", "kspec-qa"]) {
      const content = readSkill(name);
      expect(content).toContain("@.agents/validation/enterprise-skills-check.md");
      expect(content).toContain(".agents/agents/");
    }
  });

  it("orchestration skills do not use platform-specific @ refs as canonical paths", () => {
    for (const name of ORCHESTRATION_SKILLS) {
      const content = readSkill(name);
      expect(content, `${name} must not use @.cursor/`).not.toContain("@.cursor/");
      expect(content, `${name} must not use @.claude/`).not.toContain("@.claude/");
      expect(content, `${name} must not use @.codex/`).not.toContain("@.codex/");
    }
  });

  it("no skill declares a platform discovery path as source of truth on the same line", () => {
    for (const name of KSPEC_SKILLS) {
      const lines = readSkill(name).split("\n");
      for (const line of lines) {
        if (!/source of truth/i.test(line)) continue;
        expect(line, `${name}: .cursor/ must not be source of truth`).not.toMatch(
          /`\.cursor\//
        );
        expect(line, `${name}: .claude/ must not be source of truth`).not.toMatch(
          /`\.claude\//
        );
        expect(line, `${name}: .codex/ must not be source of truth`).not.toMatch(
          /`\.codex\//
        );
      }
    }
  });

  it("all three subagent_type agents exist under .agents/agents/", () => {
    for (const agent of SUBAGENT_TYPES) {
      const agentPath = resolve(AGENTS_DIR, agent, "AGENT.md");
      expect(existsSync(agentPath), `${agent}/AGENT.md must exist`).toBe(true);
    }
  });
});
