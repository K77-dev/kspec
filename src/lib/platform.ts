import { symlink, lstat, readlink, rm } from "node:fs/promises";
import { relative, dirname } from "node:path";
import fsExtra from "fs-extra";

const { copy, pathExists } = fsExtra;

export type LinkResult = "symlinked" | "copied" | "skipped-idempotent";

export function isOnWindows(): boolean {
  return process.platform === "win32";
}

async function isIdempotentSymlink(
  source: string,
  destination: string,
): Promise<boolean> {
  try {
    const stat = await lstat(destination);
    if (!stat.isSymbolicLink()) return false;
    const existing = await readlink(destination);
    const expected = relative(dirname(destination), source);
    return existing === expected;
  } catch {
    return false;
  }
}

async function isIdempotentCopy(destination: string): Promise<boolean> {
  return pathExists(destination);
}

async function removeIfExists(destination: string): Promise<void> {
  try {
    await rm(destination, { recursive: true, force: true });
  } catch {
    // nothing to remove
  }
}

async function createSymlink(source: string, destination: string): Promise<void> {
  const target = relative(dirname(destination), source);
  await removeIfExists(destination);
  await symlink(target, destination);
}

export async function linkOrCopy(
  source: string,
  destination: string,
): Promise<LinkResult> {
  if (isOnWindows()) {
    if (await isIdempotentCopy(destination)) return "skipped-idempotent";
    await copy(source, destination, { overwrite: true });
    return "copied";
  }

  if (await isIdempotentSymlink(source, destination)) return "skipped-idempotent";
  await createSymlink(source, destination);
  return "symlinked";
}
