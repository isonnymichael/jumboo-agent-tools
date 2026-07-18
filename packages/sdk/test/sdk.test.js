/**
 * SDK tests — run with `node --test` (no test framework needed).
 * These cover the offline, deterministic parts: signing, marker building,
 * recovery, and input validation. Network/on-chain calls are not exercised here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  OUTCOME,
  OUTCOME_NAME,
  isTaskId,
  isSignature,
  signTask,
  markerBlock,
  buildMarker,
  recoverMarkerSigner,
  deriveHotWallet,
  hotWalletPath,
  generateMnemonic,
} from "../src/index.js";

// A deterministic well-known test key (hardhat account #0) — TEST ONLY.
const KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const TASK_ID = "0x" + "a".repeat(64);

test("isTaskId / isSignature validate shapes", () => {
  assert.equal(isTaskId(TASK_ID), true);
  assert.equal(isTaskId("0x123"), false);
  assert.equal(isTaskId(undefined), false);
  assert.equal(isSignature("0x" + "b".repeat(130)), true);
  assert.equal(isSignature("0x" + "b".repeat(64)), false);
});

test("OUTCOME maps to the contract enum", () => {
  assert.deepEqual(OUTCOME, { Rejected: 0, Superseded: 1, Merged: 2 });
  assert.equal(OUTCOME_NAME[OUTCOME.Merged], "Merged");
});

test("signTask signs raw bytes and recovers to the signer (key or wallet)", async () => {
  const fromKey = await signTask(TASK_ID, KEY);
  const fromWallet = await signTask(TASK_ID, new ethers.Wallet(KEY));
  assert.equal(fromKey, fromWallet); // signing is deterministic for the same input
  assert.equal(isSignature(fromKey), true);
  assert.equal(recoverMarkerSigner(TASK_ID, fromKey), ADDRESS);
});

test("signTask signs RAW bytes, not the hex string (the common mistake)", async () => {
  const wallet = new ethers.Wallet(KEY);
  const correct = await signTask(TASK_ID, KEY);
  const wrongStringSig = await wallet.signMessage(TASK_ID); // signing the string
  assert.notEqual(correct, wrongStringSig);
  // Correct one recovers to the signer; the string-signed one does not, under the raw-bytes check.
  assert.equal(recoverMarkerSigner(TASK_ID, correct), ADDRESS);
  assert.notEqual(recoverMarkerSigner(TASK_ID, wrongStringSig), ADDRESS);
});

test("markerBlock produces the exact three-line format", () => {
  const marker = markerBlock({ taskId: TASK_ID, agentId: 1, signature: "0x" + "c".repeat(130) });
  const lines = marker.split("\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[0], `Jumboo-Task: ${TASK_ID}`);
  assert.equal(lines[1], "Jumboo-Agent: 1");
  assert.equal(lines[2], `Jumboo-Signature: 0x${"c".repeat(130)}`);
});

test("buildMarker signs and formats in one step", async () => {
  const { signature, marker } = await buildMarker({ taskId: TASK_ID, agentId: 7, hotWallet: KEY });
  assert.equal(recoverMarkerSigner(TASK_ID, signature), ADDRESS);
  assert.ok(marker.includes("Jumboo-Agent: 7"));
  assert.ok(marker.includes(`Jumboo-Signature: ${signature}`));
});

test("invalid inputs throw clear errors", async () => {
  await assert.rejects(() => signTask("0xnope", KEY), /invalid taskId/);
  assert.throws(() => markerBlock({ taskId: TASK_ID, agentId: "", signature: "0x1" }), /agentId is required/);
  assert.throws(() => markerBlock({ taskId: TASK_ID, agentId: 1 }), /signature is required/);
});

test("deriveHotWallet is deterministic and distinct per index", () => {
  const phrase = generateMnemonic();
  assert.equal(phrase.split(" ").length, 12);
  assert.equal(hotWalletPath(3), "m/44'/60'/0'/0/3");

  const a0 = deriveHotWallet(phrase, 0);
  const a0again = deriveHotWallet(phrase, 0);
  const a1 = deriveHotWallet(phrase, 1);
  assert.equal(a0.address, a0again.address); // same master+index → same wallet
  assert.notEqual(a0.address, a1.address); // distinct index → distinct wallet
  assert.match(a0.address, /^0x[0-9a-fA-F]{40}$/);
});

test("deriveHotWallet can sign a task marker (works with buildMarker)", async () => {
  const wallet = deriveHotWallet(generateMnemonic(), 5);
  const { signature } = await buildMarker({ taskId: TASK_ID, agentId: 9, hotWallet: wallet });
  assert.equal(recoverMarkerSigner(TASK_ID, signature), wallet.address);
});

test("deriveHotWallet rejects a bad index or empty mnemonic", () => {
  assert.throws(() => hotWalletPath(-1), /non-negative integer/);
  assert.throws(() => deriveHotWallet("", 0), /master mnemonic is required/);
});
