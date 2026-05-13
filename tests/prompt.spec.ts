import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockAnswer = "";
let mockClose = vi.fn();
let mockQuestion = vi.fn();

vi.mock("node:readline/promises", () => ({
  createInterface: () => ({
    question: mockQuestion,
    close: mockClose,
  }),
}));

beforeEach(() => {
  mockClose = vi.fn();
  mockQuestion = vi.fn().mockResolvedValue(mockAnswer);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function withAnswer<T>(answer: string, fn: () => Promise<T>): Promise<T> {
  mockAnswer = answer;
  mockQuestion = vi.fn().mockResolvedValue(answer);
  return fn();
}

describe("confirm", () => {
  it("returns true when user types 'y'", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("y", () => confirm("Proceed?"));
    expect(result).toBe(true);
  });

  it("returns false when user types 'n'", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("n", () => confirm("Proceed?"));
    expect(result).toBe(false);
  });

  it("returns defaultYes=true when user presses enter", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("", () => confirm("Proceed?", true));
    expect(result).toBe(true);
  });

  it("returns false by default when user presses enter with defaultYes=false", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("", () => confirm("Proceed?", false));
    expect(result).toBe(false);
  });

  it("returns true when user types 's' (Portuguese yes)", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("s", () => confirm("Continuar?"));
    expect(result).toBe(true);
  });

  it("returns true when user types 'sim'", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("sim", () => confirm("Continuar?"));
    expect(result).toBe(true);
  });

  it("returns true when user types 'yes'", async () => {
    const { confirm } = await import("../src/utils/prompt.js");
    const result = await withAnswer("yes", () => confirm("Continue?"));
    expect(result).toBe(true);
  });
});

describe("prompt", () => {
  it("returns the trimmed text entered by the user", async () => {
    const { prompt } = await import("../src/utils/prompt.js");
    const result = await withAnswer("  my answer  ", () => prompt("What is your name?"));
    expect(result).toBe("my answer");
  });

  it("returns an empty string when user presses enter without typing", async () => {
    const { prompt } = await import("../src/utils/prompt.js");
    const result = await withAnswer("", () => prompt("Enter value:"));
    expect(result).toBe("");
  });

  it("appends a space to the question when calling rl.question", async () => {
    const { prompt } = await import("../src/utils/prompt.js");
    await withAnswer("ok", () => prompt("Enter:"));
    expect(mockQuestion).toHaveBeenCalledWith("Enter: ");
  });

  it("closes the readline interface after receiving input", async () => {
    const { prompt } = await import("../src/utils/prompt.js");
    await withAnswer("value", () => prompt("Question?"));
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("closes the interface even when an error occurs", async () => {
    const { prompt } = await import("../src/utils/prompt.js");
    mockQuestion = vi.fn().mockRejectedValue(new Error("IO failure"));
    await expect(prompt("Question?")).rejects.toThrow("IO failure");
    expect(mockClose).toHaveBeenCalledOnce();
  });
});
