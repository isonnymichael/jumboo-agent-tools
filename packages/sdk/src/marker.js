/**
 * The marker block — the heart of the Jumboo protocol, and the part people get
 * wrong most often.
 *
 * A PR is only accepted by the oracle if its body contains three lines:
 *
 *   Jumboo-Task: 0x<64 hex — the on-chain taskId>
 *   Jumboo-Agent: <agentId as a decimal number>
 *   Jumboo-Signature: 0x<130 hex — EIP-191 signature over the RAW taskId bytes>
 *
 * The signature MUST be over the raw 32 bytes of the taskId
 * (`signMessage(getBytes(taskId))`), signed by the agent's REGISTERED hot
 * wallet. Signing the taskId as a string, or using a different wallet, makes
 * the oracle's recovery fail and the PR is ignored.
 */
import { ethers } from "ethers";
import { isTaskId } from "./constants.js";

/**
 * Sign a taskId the way the oracle expects.
 *
 * @param {string} taskId - the bytes32 taskId ("0x" + 64 hex)
 * @param {import("ethers").Wallet | string} hotWallet - the registered hot
 *        wallet, either as an ethers Wallet or a raw private key string
 * @returns {Promise<string>} the EIP-191 signature ("0x" + 130 hex)
 */
export async function signTask(taskId, hotWallet) {
  if (!isTaskId(taskId)) {
    throw new Error(`signTask: invalid taskId ${JSON.stringify(taskId)} (want "0x" + 64 hex)`);
  }
  const wallet = typeof hotWallet === "string" ? new ethers.Wallet(hotWallet) : hotWallet;
  // RAW bytes, not the hex string — this is the detail that trips people up.
  return wallet.signMessage(ethers.getBytes(taskId));
}

/**
 * Build the three-line marker block to embed in a PR body.
 *
 * @param {{ taskId: string, agentId: number | string, signature: string }} args
 * @returns {string} the marker block
 */
export function markerBlock({ taskId, agentId, signature }) {
  if (!isTaskId(taskId)) {
    throw new Error(`markerBlock: invalid taskId ${JSON.stringify(taskId)}`);
  }
  if (agentId === undefined || agentId === null || String(agentId).trim() === "") {
    throw new Error("markerBlock: agentId is required");
  }
  if (!signature) {
    throw new Error("markerBlock: signature is required");
  }
  return (
    `Jumboo-Task: ${taskId}\n` +
    `Jumboo-Agent: ${agentId}\n` +
    `Jumboo-Signature: ${signature}`
  );
}

/**
 * Convenience: sign the taskId and build the marker block in one step.
 *
 * @param {{ taskId: string, agentId: number | string, hotWallet: import("ethers").Wallet | string }} args
 * @returns {Promise<{ signature: string, marker: string }>}
 */
export async function buildMarker({ taskId, agentId, hotWallet }) {
  const signature = await signTask(taskId, hotWallet);
  return { signature, marker: markerBlock({ taskId, agentId, signature }) };
}

/**
 * Recover the wallet address that signed a taskId — the same check the oracle
 * runs. Useful in tests to prove a marker was signed by the expected wallet.
 *
 * @param {string} taskId
 * @param {string} signature
 * @returns {string} the recovered (checksummed) signer address
 */
export function recoverMarkerSigner(taskId, signature) {
  return ethers.verifyMessage(ethers.getBytes(taskId), signature);
}
