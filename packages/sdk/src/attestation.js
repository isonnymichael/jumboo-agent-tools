/**
 * Talking to the Jumboo oracle.
 *
 * After a PR is merged by a human, the oracle signs an EIP-712 attestation.
 * The agent fetches it here, then submits it on-chain (see validation.js) to
 * release the escrow. The oracle only signs — the agent settles.
 */
import { isTaskId } from "./constants.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Build the attestation URL, tolerating a trailing slash on oracleUrl. */
function attestationUrl(oracleUrl, taskId, agentId) {
  const base = String(oracleUrl || "").replace(/\/+$/, "");
  return `${base}/attestations/${taskId}/${agentId}`;
}

/**
 * Fetch the attestation once.
 *
 * @param {{ oracleUrl: string, taskId: string, agentId: number | string }} args
 * @returns {Promise<object | null>} the attestation JSON, or null when the
 *          oracle has none yet (HTTP 404 — PR not merged / not yet verified)
 */
export async function getAttestation({ oracleUrl, taskId, agentId }) {
  if (!isTaskId(taskId)) throw new Error(`getAttestation: invalid taskId ${JSON.stringify(taskId)}`);
  const url = attestationUrl(oracleUrl, taskId, agentId);
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`oracle responded ${res.status} for ${url}`);
  return res.json();
}

/**
 * Poll the oracle until an attestation exists, then return it.
 *
 * @param {object} args
 * @param {string} args.oracleUrl
 * @param {string} args.taskId
 * @param {number | string} args.agentId
 * @param {number} [args.intervalMs=60000] - delay between polls
 * @param {number} [args.timeoutMs] - give up after this long (default: never)
 * @param {AbortSignal} [args.signal] - abort the polling loop
 * @param {(info: { waiting?: boolean, error?: Error }) => void} [args.onPoll] -
 *        called on each attempt, e.g. for logging
 * @returns {Promise<object>} the attestation JSON
 */
export async function pollAttestation({
  oracleUrl,
  taskId,
  agentId,
  intervalMs = 60_000,
  timeoutMs,
  signal,
  onPoll,
}) {
  const startedAt = Date.now();
  for (;;) {
    if (signal?.aborted) throw new Error("pollAttestation: aborted");

    let attestation = null;
    try {
      attestation = await getAttestation({ oracleUrl, taskId, agentId });
    } catch (err) {
      // Transient oracle/network errors shouldn't kill the loop — report and retry.
      onPoll?.({ error: err });
    }
    if (attestation) return attestation;

    if (timeoutMs !== undefined && Date.now() - startedAt >= timeoutMs) {
      throw new Error(`pollAttestation: timed out after ${timeoutMs}ms`);
    }
    onPoll?.({ waiting: true });
    await sleep(intervalMs);
  }
}
