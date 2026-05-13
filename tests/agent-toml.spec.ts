import { describe, expect, it, vi, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseAgentFile,
  renderAgentToml,
  resolveSandboxMode,
  type AgentDocument,
} from "../src/lib/agent-toml.js";

function createTempDir(): string {
  const dir = join(tmpdir(), `kspec-agent-toml-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeTempAgent(dir: string, name: string, content: string): string {
  const filePath = join(dir, name);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseAgentFile", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("parses minimal frontmatter with name and description", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(
      tempDir,
      "AGENT.md",
      "---\nname: kspec-task-runner\ndescription: Runs tasks.\n---\nBody content here."
    );
    const doc = parseAgentFile(filePath);
    expect(doc.frontmatter.name).toBe("kspec-task-runner");
    expect(doc.frontmatter.description).toBe("Runs tasks.");
    expect(doc.body).toBe("Body content here.");
  });

  it("parses body content correctly when body has multiple lines", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(
      tempDir,
      "AGENT.md",
      "---\nname: kspec-qa-runner\ndescription: QA agent.\n---\nLine one.\nLine two.\n"
    );
    const doc = parseAgentFile(filePath);
    expect(doc.body).toContain("Line one.");
    expect(doc.body).toContain("Line two.");
  });

  it("rejects file with missing frontmatter delimiter", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(
      tempDir,
      "AGENT.md",
      "name: kspec-task-runner\ndescription: No delimiters here.\nBody here."
    );
    expect(() => parseAgentFile(filePath)).toThrowError(/Missing or malformed frontmatter/);
  });

  it("rejects frontmatter without name field", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(
      tempDir,
      "AGENT.md",
      "---\ndescription: No name field.\n---\nBody here."
    );
    expect(() => parseAgentFile(filePath)).toThrowError(/Missing required frontmatter field 'name'/);
  });

  it("rejects frontmatter without description field", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(
      tempDir,
      "AGENT.md",
      "---\nname: kspec-task-runner\n---\nBody here."
    );
    expect(() => parseAgentFile(filePath)).toThrowError(/Missing required frontmatter field 'description'/);
  });

  it("error message includes file path for missing name", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(
      tempDir,
      "AGENT.md",
      "---\ndescription: Only description.\n---\nBody."
    );
    expect(() => parseAgentFile(filePath)).toThrowError(filePath);
  });

  it("error message includes file path for malformed frontmatter", () => {
    tempDir = createTempDir();
    const filePath = writeTempAgent(tempDir, "AGENT.md", "No frontmatter at all.");
    expect(() => parseAgentFile(filePath)).toThrowError(filePath);
  });
});

describe("renderAgentToml", () => {
  const baseDoc: AgentDocument = {
    frontmatter: { name: "kspec-task-runner", description: "A simple description." },
    body: "This is the body content.",
  };

  it("renders valid TOML with all required keys", () => {
    const toml = renderAgentToml(baseDoc, "workspace-write");
    expect(toml).toContain('name = "kspec-task-runner"');
    expect(toml).toContain('description = "A simple description."');
    expect(toml).toContain('sandbox_mode = "workspace-write"');
    expect(toml).toContain("developer_instructions");
  });

  it("renders developer_instructions as TOML multi-line string", () => {
    const toml = renderAgentToml(baseDoc, "workspace-write");
    expect(toml).toContain('developer_instructions = """');
    expect(toml).toContain(baseDoc.body);
    expect(toml.endsWith('"""\n')).toBe(true);
  });

  it("escapes backslash in description", () => {
    const doc: AgentDocument = {
      frontmatter: { name: "kspec-task-runner", description: "Path: C:\\Users\\foo" },
      body: "Body.",
    };
    const toml = renderAgentToml(doc, "workspace-write");
    expect(toml).toContain('"Path: C:\\\\Users\\\\foo"');
  });

  it("escapes double quotes in description", () => {
    const doc: AgentDocument = {
      frontmatter: { name: "kspec-task-runner", description: 'Say "hello"' },
      body: "Body.",
    };
    const toml = renderAgentToml(doc, "workspace-write");
    expect(toml).toContain('"Say \\"hello\\""');
  });

  it("escapes both backslash and double quotes combined in description", () => {
    const doc: AgentDocument = {
      frontmatter: { name: "kspec-task-runner", description: 'Path: \\"quoted\\"' },
      body: "Body.",
    };
    const toml = renderAgentToml(doc, "workspace-write");
    const rendered = renderAgentToml(doc, "workspace-write");
    expect(rendered).toContain("description =");
  });

  it("throws controlled error when body contains triple-quote sequence", () => {
    const doc: AgentDocument = {
      frontmatter: { name: "kspec-task-runner", description: "Valid description." },
      body: 'Some body with """ inside.',
    };
    expect(() => renderAgentToml(doc, "workspace-write")).toThrowError(/contains literal.*"""/);
  });

  it("error message for triple-quote includes agent name", () => {
    const doc: AgentDocument = {
      frontmatter: { name: "kspec-special-agent", description: "Valid description." },
      body: 'Body with """ triple quotes.',
    };
    expect(() => renderAgentToml(doc, "workspace-write")).toThrowError("kspec-special-agent");
  });

  it("renders read-only sandbox mode", () => {
    const toml = renderAgentToml(baseDoc, "read-only");
    expect(toml).toContain('sandbox_mode = "read-only"');
  });
});

describe("resolveSandboxMode", () => {
  it("maps kspec-task-runner to workspace-write", () => {
    const mode = resolveSandboxMode("kspec-task-runner");
    expect(mode).toBe("workspace-write");
  });

  it("maps kspec-review-runner to read-only", () => {
    const mode = resolveSandboxMode("kspec-review-runner");
    expect(mode).toBe("read-only");
  });

  it("maps kspec-qa-runner to workspace-write", () => {
    const mode = resolveSandboxMode("kspec-qa-runner");
    expect(mode).toBe("workspace-write");
  });

  it("returns default workspace-write for unknown agent", () => {
    const mode = resolveSandboxMode("kspec-unknown-agent", () => {});
    expect(mode).toBe("workspace-write");
  });

  it("emits warning via callback for unknown agent", () => {
    const warnings: string[] = [];
    resolveSandboxMode("kspec-enterprise-custom", (msg) => warnings.push(msg));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("kspec-enterprise-custom");
    expect(warnings[0]).toContain("workspace-write");
  });

  it("emits warning to stderr when no callback provided for unknown agent", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    resolveSandboxMode("kspec-no-callback-agent");
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("kspec-no-callback-agent"));
    stderrSpy.mockRestore();
  });
});

describe("integration: parseAgentFile + renderAgentToml", () => {
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("round-trips a real-looking AGENT.md to valid TOML output", () => {
    tempDir = createTempDir();
    const agentContent = [
      "---",
      "name: kspec-task-runner",
      "version: 1.0.0",
      "description: Implementa uma tarefa de desenvolvimento específica.",
      "---",
      "",
      "## Instructions",
      "",
      "You are an AI assistant responsible for implementing tasks.",
      "",
      "### Rules",
      "",
      "- Read the PRD before implementing.",
    ].join("\n");
    const filePath = writeTempAgent(tempDir, "AGENT.md", agentContent);
    const doc = parseAgentFile(filePath);
    const sandboxMode = resolveSandboxMode(doc.frontmatter.name, () => {});
    const toml = renderAgentToml(doc, sandboxMode);
    expect(toml).toContain('name = "kspec-task-runner"');
    expect(toml).toContain('sandbox_mode = "workspace-write"');
    expect(toml).toContain("## Instructions");
    expect(toml).toContain("Read the PRD before implementing.");
  });

  it("version field in frontmatter is ignored (not in output)", () => {
    tempDir = createTempDir();
    const agentContent =
      "---\nname: kspec-review-runner\nversion: 1.0.0\ndescription: Review agent.\n---\nBody.";
    const filePath = writeTempAgent(tempDir, "AGENT.md", agentContent);
    const doc = parseAgentFile(filePath);
    expect(doc.frontmatter).not.toHaveProperty("version");
    const toml = renderAgentToml(doc, "read-only");
    expect(toml).not.toContain("version");
  });
});
