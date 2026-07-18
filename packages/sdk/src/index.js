/**
 * @jumboo/agent-sdk — core protocol helpers for building a Jumboo agent.
 *
 * The four things every agent must do, made hard to get wrong:
 *   1. signTask       — sign the raw taskId bytes with the registered hot wallet
 *   2. markerBlock    — build the PR marker block the oracle verifies
 *   3. pollAttestation — wait for the oracle's attestation after a human merge
 *   4. submitValidation — submit it on-chain to release the escrow
 *
 * Plus `claim`, a convenience that does steps 3 and 4 together.
 */
export { OUTCOME, OUTCOME_NAME, TASK_ID_RE, SIGNATURE_RE, isTaskId, isSignature } from "./constants.js";
export { signTask, markerBlock, buildMarker, recoverMarkerSigner } from "./marker.js";
export { getAttestation, pollAttestation } from "./attestation.js";
export { submitValidation, VALIDATION_ABI } from "./validation.js";
export { hotWalletPath, deriveHotWallet, generateMnemonic } from "./wallet.js";

import { pollAttestation } from "./attestation.js";
import { submitValidation } from "./validation.js";

/**
 * Wait for the oracle's attestation, then submit it on-chain to settle the task.
 * Combines pollAttestation + submitValidation — the whole claim flow in one call.
 *
 * The outcome/agentId are taken from the attestation the oracle returns, so the
 * on-chain submission always matches what the oracle actually signed.
 *
 * @param {object} args
 * @param {string} args.oracleUrl
 * @param {string} args.registryAddress - JumbooValidationRegistry address
 * @param {string} args.taskId
 * @param {number | string} args.agentId
 * @param {import("ethers").Wallet} args.wallet - provider-connected, pays gas
 * @param {number} [args.intervalMs] - poll interval (see pollAttestation)
 * @param {number} [args.timeoutMs] - poll timeout (see pollAttestation)
 * @param {AbortSignal} [args.signal]
 * @param {(info: object) => void} [args.onPoll]
 * @returns {Promise<{ attestation: object, receipt: { hash: string, blockNumber: number, status: number } }>}
 */
export async function claim({
  oracleUrl,
  registryAddress,
  taskId,
  agentId,
  wallet,
  intervalMs,
  timeoutMs,
  signal,
  onPoll,
}) {
  const attestation = await pollAttestation({ oracleUrl, taskId, agentId, intervalMs, timeoutMs, signal, onPoll });
  const receipt = await submitValidation({
    registryAddress,
    taskId,
    // Prefer the values the oracle attested to; fall back to the caller's agentId.
    agentId: attestation.agentId ?? agentId,
    outcome: Number(attestation.outcome),
    signature: attestation.signature,
    wallet,
  });
  return { attestation, receipt };
}
