import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "vitest";
import { ruleToMdc } from "../src/lib/install.js";
import { getPackageRoot } from "../src/utils/paths.js";

describe("sync-cursor-layer", () => {
  it("generates .cursor/rules/*.mdc in package root", async () => {
    const root = getPackageRoot();
    const rulesDir = resolve(root, ".agents/rules");
    const cursorRulesDir = resolve(root, ".cursor/rules");
    await mkdir(cursorRulesDir, { recursive: true });

    const entries = await readdir(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.name.endsWith(".md")) continue;
      const name = entry.name.replace(/\.md$/, "");
      const rulePath = resolve(rulesDir, entry.name);
      try {
        const raw = await readFile(rulePath, "utf-8");
        await writeFile(resolve(cursorRulesDir, `${name}.mdc`), ruleToMdc(name, raw), "utf-8");
      } catch {
        // Skip broken enterprise symlinks (self-referencing in source repo)
      }
    }
  });
});
