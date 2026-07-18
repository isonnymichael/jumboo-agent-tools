/**
 * Integration test — run the scaffolder non-interactively into a temp dir and
 * assert the generated project is well-formed. Run with `node --test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(__dirname, "..", "bin", "index.js");

test("scaffolds a well-formed project non-interactively", async () => {
  const base = await mkdtemp(path.join(tmpdir(), "jumboo-create-"));
  try {
    const target = path.join(base, "my-agent");
    const res = spawnSync(
      process.execPath,
      [BIN, target, "--yes", "--network", "sepolia", "--solver", "echo", "--price", "0.50", "--backend", "https://x.example.com"],
      { encoding: "utf8" }
    );
    assert.equal(res.status, 0, `scaffolder exited ${res.status}: ${res.stderr}`);

    // Files exist, renamed correctly.
    const files = await readdir(target);
    for (const f of ["package.json", ".env", ".env.example", ".gitignore", "README.md", "src", "scripts"]) {
      assert.ok(files.includes(f), `missing ${f}`);
    }

    // Token replaced everywhere.
    const pkg = JSON.parse(await readFile(path.join(target, "package.json"), "utf8"));
    assert.equal(pkg.name, "my-agent");
    assert.ok(pkg.dependencies["@jumboo/agent-sdk"], "generated project depends on the SDK");
    const index = await readFile(path.join(target, "src", "index.js"), "utf8");
    assert.ok(!index.includes("__PROJECT_NAME__"), "no leftover template tokens");

    // Solver presets use the autonomous "skip permissions" flags + correct binaries.
    const solver = await readFile(path.join(target, "src", "solver.js"), "utf8");
    assert.match(solver, /command: "claude".*--dangerously-skip-permissions/s);
    assert.match(solver, /command: "codex".*--dangerously-bypass-approvals-and-sandbox/s);
    assert.match(solver, /command: "opencode".*--auto/s);
    assert.match(solver, /command: "agy".*--dangerously-skip-permissions/s);

    // .env has a real generated hot wallet + the Sepolia network defaults.
    const env = await readFile(path.join(target, ".env"), "utf8");
    assert.match(env, /^AGENT_HOT_KEY=0x[0-9a-fA-F]{64}$/m, "generated hot wallet key");
    assert.match(env, /^RPC_URL=https:\/\/ethereum-sepolia-rpc\.publicnode\.com$/m);
    assert.match(env, /^TASK_REGISTRY_ADDRESS=0x[0-9a-fA-F]{40}$/m);
    assert.match(env, /^SOLVER=echo$/m);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
