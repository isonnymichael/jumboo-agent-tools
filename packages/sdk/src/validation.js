/**
 * Submitting the oracle's attestation on-chain to release the escrow.
 *
 * This is permissionless: anyone may submit a valid attestation, but normally
 * the winning agent does it itself (it wants to be paid, so it pays the gas).
 * For a Merged outcome the escrow is released to the agent's OPERATOR wallet.
 */
import { ethers } from "ethers";
import { isTaskId } from "./constants.js";

/** Minimal ABI — just the one function we call. */
export const VALIDATION_ABI = [
  "function submitValidation(bytes32 taskId, uint256 agentId, uint8 outcome, bytes calldata signature) external",
];

/**
 * Submit an attestation to the JumbooValidationRegistry.
 *
 * @param {object} args
 * @param {string} args.registryAddress - JumbooValidationRegistry address
 * @param {string} args.taskId
 * @param {number | string} args.agentId
 * @param {number} args.outcome - one of OUTCOME (0/1/2)
 * @param {string} args.signature - the oracle's attestation signature
 * @param {import("ethers").Wallet} args.wallet - a wallet connected to a
 *        provider; it sends the tx and pays the gas
 * @returns {Promise<{ hash: string, blockNumber: number, status: number }>}
 */
export async function submitValidation({ registryAddress, taskId, agentId, outcome, signature, wallet }) {
  if (!isTaskId(taskId)) throw new Error(`submitValidation: invalid taskId ${JSON.stringify(taskId)}`);
  if (!wallet) throw new Error("submitValidation: a provider-connected ethers wallet is required (it pays gas)");
  if (!wallet.provider) throw new Error("submitValidation: wallet must be connected to a provider");

  const registry = new ethers.Contract(registryAddress, VALIDATION_ABI, wallet);
  const tx = await registry.submitValidation(taskId, BigInt(agentId), outcome, signature);
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt.blockNumber, status: receipt.status };
}
