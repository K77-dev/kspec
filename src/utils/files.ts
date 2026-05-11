import { resolve } from "node:path";
import fsExtra from "fs-extra";

const { copy, ensureDir, pathExists } = fsExtra;

export interface CopyResult {
  name: string;
  source: string;
  destination: string;
  copied: boolean;
}

export async function copyDirIfExists(
  sourceDir: string,
  destinationDir: string,
  name: string,
): Promise<CopyResult> {
  const exists = await pathExists(sourceDir);
  if (!exists) {
    return { name, source: sourceDir, destination: destinationDir, copied: false };
  }
  await ensureDir(destinationDir);
  await copy(sourceDir, destinationDir, { overwrite: true });
  return { name, source: sourceDir, destination: destinationDir, copied: true };
}

export function joinDest(targetRoot: string, ...segments: string[]): string {
  return resolve(targetRoot, ...segments);
}
