import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import {
  getPackageRoot,
  getClaudeSourceDir,
  getAgentsSourceDir,
  getCodexSourceDir,
  getAgentsMdSource,
  getClaudeMdSource,
  getPackageVersion,
} from "../src/utils/paths.js";

describe("getPackageRoot", () => {
  it("returns a directory that contains package.json", () => {
    const root = getPackageRoot();
    expect(existsSync(`${root}/package.json`)).toBe(true);
  });

  it("returns an absolute path", () => {
    const root = getPackageRoot();
    expect(root.startsWith("/") || /^[A-Z]:\\/.test(root)).toBe(true);
  });
});

describe("getClaudeSourceDir", () => {
  it("returns path ending in .claude", () => {
    const dir = getClaudeSourceDir();
    expect(dir.endsWith(".claude")).toBe(true);
  });

  it("is a subdirectory of the package root", () => {
    const root = getPackageRoot();
    const dir = getClaudeSourceDir();
    expect(dir.startsWith(root)).toBe(true);
  });
});

describe("getAgentsSourceDir", () => {
  it("returns path ending in .agents", () => {
    const dir = getAgentsSourceDir();
    expect(dir.endsWith(".agents")).toBe(true);
  });

  it("is a subdirectory of the package root", () => {
    const root = getPackageRoot();
    const dir = getAgentsSourceDir();
    expect(dir.startsWith(root)).toBe(true);
  });
});

describe("getCodexSourceDir", () => {
  it("returns path ending in .codex", () => {
    const dir = getCodexSourceDir();
    expect(dir.endsWith(".codex")).toBe(true);
  });

  it("is a subdirectory of the package root", () => {
    const root = getPackageRoot();
    const dir = getCodexSourceDir();
    expect(dir.startsWith(root)).toBe(true);
  });

  it("is a different path from getClaudeSourceDir", () => {
    expect(getCodexSourceDir()).not.toBe(getClaudeSourceDir());
  });

  it("is a different path from getAgentsSourceDir", () => {
    expect(getCodexSourceDir()).not.toBe(getAgentsSourceDir());
  });
});

describe("getAgentsMdSource", () => {
  it("returns path ending in AGENTS.md", () => {
    const p = getAgentsMdSource();
    expect(p.endsWith("AGENTS.md")).toBe(true);
  });

  it("is under the package root", () => {
    const root = getPackageRoot();
    expect(getAgentsMdSource().startsWith(root)).toBe(true);
  });
});

describe("getClaudeMdSource", () => {
  it("returns path ending in CLAUDE.md", () => {
    const p = getClaudeMdSource();
    expect(p.endsWith("CLAUDE.md")).toBe(true);
  });

  it("is under the package root", () => {
    const root = getPackageRoot();
    expect(getClaudeMdSource().startsWith(root)).toBe(true);
  });
});

describe("getPackageVersion", () => {
  it("returns a non-empty string", () => {
    const version = getPackageVersion();
    expect(typeof version).toBe("string");
    expect(version.length).toBeGreaterThan(0);
  });

  it("matches semver-like format (x.y.z)", () => {
    const version = getPackageVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
