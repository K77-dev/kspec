import { readFileSync } from "node:fs";

export type SandboxMode = "workspace-write" | "read-only";

export interface AgentFrontmatter {
  name: string;
  description: string;
}

export interface AgentDocument {
  frontmatter: AgentFrontmatter;
  body: string;
}

const SANDBOX_BY_AGENT: Record<string, SandboxMode> = {
  "kspec-task-runner": "workspace-write",
  "kspec-review-runner": "read-only",
  "kspec-qa-runner": "workspace-write",
};

const DEFAULT_SANDBOX_MODE: SandboxMode = "workspace-write";

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

function parseFrontmatterBlock(block: string, filePath: string): AgentFrontmatter {
  let name: string | undefined;
  let description: string | undefined;
  for (const line of block.split("\n")) {
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) {
      name = nameMatch[1]!.trim();
      continue;
    }
    const descriptionMatch = line.match(/^description:\s*(.+)$/);
    if (descriptionMatch) {
      description = descriptionMatch[1]!.trim();
    }
  }
  if (!name) {
    throw new Error(`Missing required frontmatter field 'name' in ${filePath}`);
  }
  if (!description) {
    throw new Error(`Missing required frontmatter field 'description' in ${filePath}`);
  }
  return { name, description };
}

export function parseAgentFile(filePath: string): AgentDocument {
  const content = readFileSync(filePath, "utf-8");
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new Error(`Missing or malformed frontmatter in ${filePath}. Expected file to start with '---\\n...\\n---\\n'.`);
  }
  const frontmatterBlock = match[1]!;
  const body = match[2]!.trim();
  const frontmatter = parseFrontmatterBlock(frontmatterBlock, filePath);
  return { frontmatter, body };
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function resolveSandboxMode(
  agentName: string,
  warnCallback?: (message: string) => void
): SandboxMode {
  const sandboxMode = SANDBOX_BY_AGENT[agentName];
  if (sandboxMode !== undefined) {
    return sandboxMode;
  }
  const message = `Warning: agent '${agentName}' not found in sandbox map. Defaulting to '${DEFAULT_SANDBOX_MODE}'.`;
  if (warnCallback) {
    warnCallback(message);
  } else {
    process.stderr.write(message + "\n");
  }
  return DEFAULT_SANDBOX_MODE;
}

export function renderAgentToml(doc: AgentDocument, sandboxMode: SandboxMode): string {
  const { frontmatter, body } = doc;
  if (body.includes('"""')) {
    throw new Error(
      `Agent body for '${frontmatter.name}' contains literal '\"\"\"' which would corrupt TOML multi-line string. Please remove or escape it in the source AGENT.md.`
    );
  }
  const escapedDescription = escapeTomlString(frontmatter.description);
  return [
    `name = "${frontmatter.name}"`,
    `description = "${escapedDescription}"`,
    `sandbox_mode = "${sandboxMode}"`,
    `developer_instructions = """`,
    body,
    `"""`,
    "",
  ].join("\n");
}
