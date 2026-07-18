/**
 * Shared constants and small validators for the Jumboo protocol.
 */

/**
 * The three validation outcomes, mirroring JumbooValidationRegistry.Outcome.
 *   Rejected   (0) — PR closed unmerged while the task was open (reputation -100)
 *   Superseded (1) — PR closed unmerged because another agent already won (neutral)
 *   Merged     (2) — PR merged by a human while the task was open (escrow released)
 */
export const OUTCOME = { Rejected: 0, Superseded: 1, Merged: 2 };

/** Reverse lookup: 0 -> "Rejected", 1 -> "Superseded", 2 -> "Merged". */
export const OUTCOME_NAME = { 0: "Rejected", 1: "Superseded", 2: "Merged" };

/** A taskId is a bytes32 value: "0x" followed by exactly 64 hex characters. */
export const TASK_ID_RE = /^0x[0-9a-fA-F]{64}$/;

/** An EIP-191 signature is a 65-byte value: "0x" followed by exactly 130 hex characters. */
export const SIGNATURE_RE = /^0x[0-9a-fA-F]{130}$/;

/** True when `value` is a well-formed bytes32 taskId. */
export function isTaskId(value) {
  return TASK_ID_RE.test(value || "");
}

/** True when `value` is a well-formed EIP-191 signature. */
export function isSignature(value) {
  return SIGNATURE_RE.test(value || "");
}
