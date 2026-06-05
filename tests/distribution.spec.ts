import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getPackageRoot } from "../src/utils/paths.js";

describe("distribution metadata", () => {
  const root = getPackageRoot();

  it("VERSION file matches package.json version", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
    const version = readFileSync(resolve(root, "VERSION"), "utf-8").trim();
    expect(version).toBe(pkg.version);
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("package.json files includes .cursor/ and CURSOR.md", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
    expect(pkg.files).toContain(".cursor/");
    expect(pkg.files).toContain("CURSOR.md");
  });

  it("description and keywords mention cursor", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
    expect(pkg.description.toLowerCase()).toContain("cursor");
    expect(pkg.keywords).toContain("cursor");
  });
});

describe("npm pack distribution", () => {
  const root = getPackageRoot();

  it("npm pack --dry-run lists .cursor/ and CURSOR.md", () => {
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: root,
      encoding: "utf-8",
    });

    expect(output).toMatch(/\.cursor\//);
    expect(output).toMatch(/CURSOR\.md/);
  });
});
