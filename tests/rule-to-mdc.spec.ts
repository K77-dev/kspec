import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { ruleToMdc } from "../src/lib/install.js";

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function extractMdcBody(mdc: string): string {
  const match = mdc.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1]! : mdc;
}

describe("ruleToMdc", () => {
  it("(a) rule com paths gera globs CSV e alwaysApply false", () => {
    const raw = [
      "---",
      "paths:",
      '  - "**/prisma/**"',
      '  - "**/drizzle/**"',
      "---",
      "",
      "# Database e ORM",
      "",
      "Conteúdo do corpo.",
    ].join("\n");

    const result = ruleToMdc("database", raw);

    expect(result).toContain('globs: "**/prisma/**,**/drizzle/**"');
    expect(result).toContain("alwaysApply: false");
    expect(result).toContain("description:");
  });

  it("(b) code-standards gera alwaysApply true", () => {
    const raw = "# Standards\n\nRegras gerais.\n";
    const result = ruleToMdc("code-standards", raw);

    expect(result).toContain("alwaysApply: true");
    expect(result).not.toContain("globs:");
    expect(result).toContain("description: Standards");
  });

  it("(c) rule sem paths e sem description extrai description do H1", () => {
    const raw = [
      "---",
      "name: graphify",
      "---",
      "",
      "# Uso do Graphify nas skills do kspec",
      "",
      "Corpo da rule.",
    ].join("\n");

    const result = ruleToMdc("graphify", raw);

    expect(result).toContain(
      "description: Uso do Graphify nas skills do kspec",
    );
    expect(result).toContain("alwaysApply: false");
    expect(result).not.toContain("globs:");
  });

  it("(d) preserva o corpo byte a byte", () => {
    const body = "\n\n# Logging\n\n```typescript\nconst x = 1;\n```\n";
    const raw = `---\npaths:\n  - "backend/src/**/*.ts"\n---\n${body}`;

    const result = ruleToMdc("logging", raw);
    const outputBody = extractMdcBody(result);

    expect(outputBody).toBe(body);
  });

  it("(e) conversão é idempotente — mesma entrada produz mesmo hash", () => {
    const raw = [
      "---",
      "paths:",
      '  - "src/**/*.ts"',
      "---",
      "",
      "# Minha Rule",
      "Linha extra.",
    ].join("\n");

    const first = ruleToMdc("minha-rule", raw);
    const second = ruleToMdc("minha-rule", raw);

    expect(hashContent(first)).toBe(hashContent(second));
    expect(first).toBe(second);
  });

  it("usa description do frontmatter quando presente", () => {
    const raw = [
      "---",
      "description: Descrição explícita no frontmatter",
      "---",
      "",
      "# Título ignorado",
    ].join("\n");

    const result = ruleToMdc("custom-rule", raw);

    expect(result).toContain("description: Descrição explícita no frontmatter");
  });

  it("usa primeira linha não vazia quando não há H1", () => {
    const raw = "Primeira linha sem heading\n\nMais conteúdo.\n";
    const result = ruleToMdc("fallback-rule", raw);

    expect(result).toContain("description: Primeira linha sem heading");
  });

  it("usa nome legível do arquivo como fallback final", () => {
    const raw = "\n\n";
    const result = ruleToMdc("my-custom-rule", raw);

    expect(result).toContain("description: My Custom Rule");
  });

  it("code-standards com paths mantém globs e alwaysApply true", () => {
    const raw = [
      "---",
      "paths:",
      '  - "**/*.ts"',
      "---",
      "",
      "# Standards",
    ].join("\n");

    const result = ruleToMdc("code-standards", raw);

    expect(result).toContain('globs: "**/*.ts"');
    expect(result).toContain("alwaysApply: true");
  });
});
