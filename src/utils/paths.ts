import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export function getPackageRoot(): string {
  let current = moduleDir;
  while (current !== dirname(current)) {
    if (existsSync(resolve(current, "package.json"))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error("Could not locate kspec package root");
}

export function getClaudeSourceDir(): string {
  return resolve(getPackageRoot(), ".claude");
}

export function getPackageVersion(): string {
  const versionFile = resolve(getPackageRoot(), "VERSION");
  return readFileSync(versionFile, "utf-8").trim();
}
