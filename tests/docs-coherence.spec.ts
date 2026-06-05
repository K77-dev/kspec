import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

const DOCS = {
  readme: resolve(ROOT, "README.md"),
  agents: resolve(ROOT, "AGENTS.md"),
  claude: resolve(ROOT, "CLAUDE.md"),
  cursor: resolve(ROOT, "CURSOR.md"),
} as const;

function readDoc(path: string): string {
  expect(existsSync(path), `${path} must exist`).toBe(true);
  return readFileSync(path, "utf-8");
}

const PLATFORMS = ["Claude Code", "OpenAI Codex CLI", "Cursor"] as const;
const DISCOVERY_DIRS = [".claude/", ".codex/", ".cursor/"] as const;
const PLATFORM_GUIDES = ["CLAUDE.md", "AGENTS.md", "CURSOR.md"] as const;

const SHARED_DESCRIPTION =
  "kit de especificações e padrões para projetos desenvolvidos com agentes de IA";

describe("docs tri-platform coherence (REQ-006 / task 9.0)", () => {
  it("README contains Matriz de plataformas with all three platforms", () => {
    const readme = readDoc(DOCS.readme);

    expect(readme).toContain("## Matriz de plataformas");
    for (const platform of PLATFORMS) {
      expect(readme).toContain(platform);
    }
    expect(readme).toContain("`.cursor/`");
    expect(readme).toContain("CURSOR.md");
  });

  it("README documents invocation styles and discovery paths per platform", () => {
    const readme = readDoc(DOCS.readme);

    expect(readme).toContain("/kspec-");
    expect(readme).toContain("$kspec-");
    expect(readme).toMatch(/linguagem natural.*kspec-|kspec-.*linguagem natural/i);
    expect(readme).toContain("`.agents/`");
    for (const dir of DISCOVERY_DIRS) {
      expect(readme).toContain(dir);
    }
  });

  it("platform guides share project description and .agents/ as source of truth", () => {
    for (const path of [DOCS.agents, DOCS.claude, DOCS.cursor]) {
      const doc = readDoc(path);
      expect(doc.toLowerCase()).toContain(SHARED_DESCRIPTION.toLowerCase());
      expect(doc).toMatch(/`\.agents\/`.*source of truth|source of truth.*`\.agents\/`/i);
    }
  });

  it("each platform guide documents platform-specific limitations", () => {
    expect(readDoc(DOCS.agents)).toContain("Limitações conhecidas no Codex");
    expect(readDoc(DOCS.cursor)).toContain("Limitações conhecidas no Cursor");
    expect(readDoc(DOCS.claude)).toContain("Limitações conhecidas no Claude Code");
  });

  it("platform guides cross-reference each other", () => {
    expect(readDoc(DOCS.agents)).toContain("CURSOR.md");
    expect(readDoc(DOCS.agents)).toContain("CLAUDE.md");
    expect(readDoc(DOCS.claude)).toContain("AGENTS.md");
    expect(readDoc(DOCS.claude)).toContain("CURSOR.md");
    expect(readDoc(DOCS.cursor)).toContain("AGENTS.md");
    expect(readDoc(DOCS.cursor)).toContain("CLAUDE.md");
  });

  it("AGENTS.md and CURSOR.md list the same discovery layer paths", () => {
    const agents = readDoc(DOCS.agents);
    const cursor = readDoc(DOCS.cursor);

    for (const dir of DISCOVERY_DIRS) {
      const label = dir.replace(/\/$/, "");
      expect(agents).toContain(label);
      expect(cursor).toContain(label);
    }

    expect(agents).toMatch(/\.cursor\/.*rules|rules.*\.mdc/i);
    expect(cursor).toContain(".cursor/rules/");
  });

  it("all three platform guides list the ten kspec skills", () => {
    const skillNames = [
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

    for (const path of [DOCS.agents, DOCS.cursor, DOCS.claude]) {
      const doc = readDoc(path);
      for (const skill of skillNames) {
        expect(doc, `${path} must list ${skill}`).toContain(skill);
      }
    }
  });

  it("release notes mention Cursor as new supported platform in v1.3.0", () => {
    const readme = readDoc(DOCS.readme);

    expect(readme).toMatch(/notas de release/i);
    expect(readme).toContain("1.3.0");
    expect(readme).toMatch(/suporte ao Cursor|Cursor como terceira/i);
  });

  it("README references all three platform guides", () => {
    const readme = readDoc(DOCS.readme);

    for (const guide of PLATFORM_GUIDES) {
      expect(readme).toContain(guide);
    }
  });
});
