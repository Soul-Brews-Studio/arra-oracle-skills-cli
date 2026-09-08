import { describe, expect, it } from "bun:test";
import { join } from "path";
import { pythonCall, skillRoot } from "./helpers";

const redactor = join(skillRoot, "scripts", "rrr-redact.py");
const receiptValidator = join(skillRoot, "scripts", "rrr-receipt.py");
const outwardFields = [
  "title", "pattern", "concepts", "source", "project", "evidence_references",
  "error_summary", "retro_text", "manifest_destination", "oracle_payload",
];

describe("RRR outward redaction", () => {
  it("rejects credential-shaped data recursively in every outward field without echo", () => {
    const secret = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
    for (const field of outwardFields) {
      const source = [
        "import importlib.util,json,sys",
        "s=importlib.util.spec_from_file_location('redactor',sys.argv[1])",
        "m=importlib.util.module_from_spec(s);s.loader.exec_module(m)",
        "try:m.compose(json.loads(sys.argv[2]))",
        "except ValueError as e:print(str(e))",
      ].join("\n");
      const payload = { [field]: field === "oracle_payload" ? { nested: [secret] } : secret };
      const process = Bun.spawnSync(["python3", "-c", source, redactor, JSON.stringify(payload)], { stdout: "pipe", stderr: "pipe" });
      const output = new TextDecoder().decode(process.stdout);
      expect(output).toContain(`credential-bearing ${field}`);
      expect(output).not.toContain(secret);
    }
  });

  it("rejects emails, explicit sensitive classification, and non-publishable origins/states", () => {
    const cases = [
      [{ title: "mail operator@example.com" }, "credential-bearing title"],
      [{ title: "private", sensitive: true }, "sensitive classification"],
      [{ title: "guess", state: "hypothesis", publish: true }, "non-publishable capture classification"],
      [{ title: "copied", origin: "copied", publish: true }, "non-publishable capture classification"],
      [{ title: "delegated", origin: "delegated", publish: true }, "non-publishable capture classification"],
    ];
    for (const [payload, message] of cases) {
      const source = "import importlib.util,json,sys;s=importlib.util.spec_from_file_location('r',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);\ntry:m.compose(json.loads(sys.argv[2]))\nexcept ValueError as e:print(str(e))";
      const process = Bun.spawnSync(["python3", "-c", source, redactor, JSON.stringify(payload)], { stdout: "pipe" });
      expect(new TextDecoder().decode(process.stdout)).toContain(message as string);
    }
  });

  it("allowlists fields and keeps direct operator statements attributed", () => {
    const result = pythonCall(redactor, "compose", [{
      title: "Observed operator preference",
      pattern: "M requested local capture",
      source: "session turn 4",
      origin: "operator",
      publish: false,
      raw_tool_output: "must not escape",
    }]) as any;
    expect(result).toEqual({
      attribution: "direct operator statement",
      pattern: "M requested local capture",
      source: "session turn 4",
      title: "Observed operator preference",
    });
  });
});

describe("RRR Oracle receipt contract", () => {
  const content = "# Durable learning\n";
  const digest = new Bun.CryptoHasher("sha256").update(content).digest("hex");
  const request = {
    canonical_project: "owner/repo",
    storage_root: "/vault/learnings",
    frozen_request: { pattern: "Durable learning", concepts: ["rrr"], project: "owner/repo", source: "rrr: owner/repo task:c1" },
    request_fingerprint: "fingerprint",
    idempotency_key: "task:c1",
  };
  const receipt = {
    outcome: "created",
    success: true,
    file: "/vault/learnings/learning.md",
    durability: { level: "full", content_hash: digest, request_fingerprint: "fingerprint" },
  };
  const readback = {
    source: "file",
    project: "owner/repo",
    resolved_path: "/vault/learnings/learning.md",
    content,
  };

  it("accepts only content-bound created/replayed/reconciled file receipts", () => {
    for (const outcome of ["created", "replayed", "reconciled"]) {
      expect(pythonCall(receiptValidator, "validate", [request, { ...receipt, outcome }, readback])).toEqual([true, "accepted"]);
    }
    for (const outcome of ["partial", "degraded", "conflict", "unknown"]) {
      expect((pythonCall(receiptValidator, "validate", [request, { ...receipt, outcome }, readback]) as any)[0]).toBe(false);
    }
  });

  it("rejects same-title different content, cache-only reads, and project/storage/file mismatch", () => {
    const cases = [
      [request, receipt, { ...readback, content: "# Durable learning\nDIFFERENT" }],
      [request, receipt, { ...readback, source: "fts_cache", resolved_path: null }],
      [request, receipt, { ...readback, project: "other/repo" }],
      [request, receipt, { ...readback, resolved_path: "/elsewhere/learning.md" }],
      [request, { ...receipt, file: "/vault/learnings/other.md" }, readback],
      [{ ...request, request_fingerprint: "changed" }, receipt, readback],
    ];
    for (const args of cases) {
      expect((pythonCall(receiptValidator, "validate", args as any[]) as any)[0]).toBe(false);
    }
  });

  it("allows one identical retry after unknown and gates supersede separately", () => {
    expect(pythonCall(receiptValidator, "retry_plan", ["unknown", 0, false])).toBe("retry-identical-once");
    expect(pythonCall(receiptValidator, "retry_plan", ["unknown", 1, false])).toBe("withheld/unknown");
    expect(pythonCall(receiptValidator, "retry_plan", ["unknown", 0, true])).toBe("withheld/unknown");
    const supersede = { ...request, operation: "supersede" };
    expect((pythonCall(receiptValidator, "validate", [supersede, receipt, readback]) as any)[1]).toContain("separate approval");
    expect(pythonCall(receiptValidator, "validate", [supersede, receipt, readback], { supersede_approved: true })).toEqual([true, "accepted"]);
  });
});
