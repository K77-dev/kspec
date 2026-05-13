import { describe, it, expect, vi, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readlink, lstat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, dirname } from "node:path";
import fsExtra from "fs-extra";

const { pathExists, copy } = fsExtra;

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "kspec-platform-test-"));
}

async function cleanup(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

describe("isOnWindows", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false on non-windows platform", async () => {
    const { isOnWindows } = await import("../src/lib/platform.js");
    if (process.platform !== "win32") {
      expect(isOnWindows()).toBe(false);
    }
  });

  it("returns true when process.platform is win32", async () => {
    vi.stubGlobal("process", { ...process, platform: "win32" });
    const mod = await import("../src/lib/platform.js?stub=win32");
    expect(mod.isOnWindows()).toBe(true);
  });
});

describe("linkOrCopy — POSIX symlink", () => {
  it.skipIf(process.platform === "win32")(
    "creates a relative symlink pointing from destination to source",
    async () => {
      const { linkOrCopy } = await import("../src/lib/platform.js");
      const tmp = await createTempDir();
      try {
        const sourceDir = join(tmp, "source-dir");
        await mkdir(sourceDir);
        await writeFile(join(sourceDir, "file.txt"), "hello");

        const destination = join(tmp, "link-dir");
        const result = await linkOrCopy(sourceDir, destination);

        expect(result).toBe("symlinked");

        const linkTarget = await readlink(destination);
        const expected = relative(dirname(destination), sourceDir);
        expect(linkTarget).toBe(expected);

        const stat = await lstat(destination);
        expect(stat.isSymbolicLink()).toBe(true);
      } finally {
        await cleanup(tmp);
      }
    },
  );

  it.skipIf(process.platform === "win32")(
    "returns skipped-idempotent on second call with same source and destination",
    async () => {
      const { linkOrCopy } = await import("../src/lib/platform.js");
      const tmp = await createTempDir();
      try {
        const sourceDir = join(tmp, "source-dir");
        await mkdir(sourceDir);

        const destination = join(tmp, "link-dir");
        await linkOrCopy(sourceDir, destination);
        const second = await linkOrCopy(sourceDir, destination);

        expect(second).toBe("skipped-idempotent");
      } finally {
        await cleanup(tmp);
      }
    },
  );

  it.skipIf(process.platform === "win32")(
    "uses a relative path (not absolute) for the symlink target",
    async () => {
      const { linkOrCopy } = await import("../src/lib/platform.js");
      const tmp = await createTempDir();
      try {
        const nestedSource = join(tmp, "a", "b", "source");
        await mkdir(nestedSource, { recursive: true });

        const destination = join(tmp, "a", "link");
        await linkOrCopy(nestedSource, destination);

        const linkTarget = await readlink(destination);
        expect(linkTarget.startsWith("/")).toBe(false);
      } finally {
        await cleanup(tmp);
      }
    },
  );
});

describe("linkOrCopy — Windows copy fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("copies source to destination when platform is win32", async () => {
    vi.stubGlobal("process", { ...process, platform: "win32" });
    vi.resetModules();

    const { linkOrCopy } = await import("../src/lib/platform.js?stub=copy");
    const tmp = await createTempDir();
    try {
      const sourceDir = join(tmp, "source");
      await mkdir(sourceDir);
      await writeFile(join(sourceDir, "data.txt"), "content");

      const destination = join(tmp, "dest");
      const result = await linkOrCopy(sourceDir, destination);

      expect(result).toBe("copied");
      expect(await pathExists(join(destination, "data.txt"))).toBe(true);

      const stat = await lstat(destination);
      expect(stat.isSymbolicLink()).toBe(false);
    } finally {
      await cleanup(tmp);
    }
  });

  it("returns skipped-idempotent on second call when destination exists (Windows)", async () => {
    vi.stubGlobal("process", { ...process, platform: "win32" });
    vi.resetModules();

    const { linkOrCopy } = await import("../src/lib/platform.js?stub=idempotent");
    const tmp = await createTempDir();
    try {
      const sourceDir = join(tmp, "source");
      await mkdir(sourceDir);

      const destination = join(tmp, "dest");
      await linkOrCopy(sourceDir, destination);
      const second = await linkOrCopy(sourceDir, destination);

      expect(second).toBe("skipped-idempotent");
    } finally {
      await cleanup(tmp);
    }
  });
});

describe("linkOrCopy — edge cases", () => {
  it.skipIf(process.platform === "win32")(
    "does not return skipped-idempotent when destination is a real directory (not a symlink)",
    async () => {
      const { linkOrCopy } = await import("../src/lib/platform.js");
      const tmp = await createTempDir();
      try {
        const sourceDir = join(tmp, "source");
        await mkdir(sourceDir);

        const destination = join(tmp, "real-dir");
        await mkdir(destination);

        const result = await linkOrCopy(sourceDir, destination);
        expect(result).toBe("symlinked");
      } finally {
        await cleanup(tmp);
      }
    },
  );

  it.skipIf(process.platform === "win32")(
    "does not return skipped-idempotent when symlink points to a different source",
    async () => {
      const { linkOrCopy } = await import("../src/lib/platform.js");
      const tmp = await createTempDir();
      try {
        const sourceA = join(tmp, "source-a");
        const sourceB = join(tmp, "source-b");
        await mkdir(sourceA);
        await mkdir(sourceB);

        const destination = join(tmp, "link");
        await linkOrCopy(sourceA, destination);
        const result = await linkOrCopy(sourceB, destination);

        expect(result).toBe("symlinked");
        const target = await readlink(destination);
        expect(target).toBe(relative(dirname(destination), sourceB));
      } finally {
        await cleanup(tmp);
      }
    },
  );
});
