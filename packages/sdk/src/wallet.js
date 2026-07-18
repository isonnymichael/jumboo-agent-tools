/**
 * Deterministic agent hot wallets.
 *
 * An operator can run MANY agents from ONE master mnemonic: each agent's hot
 * wallet is HD-derived at a per-agent index. The frontend derives the address
 * to register; the backend derives the same wallet to sign — without ever
 * sharing a private key or pasting a wallet per agent.
 *
 * Both sides MUST derive identically, so this lives in the shared SDK.
 */
import { ethers } from "ethers";

/** BIP-44 Ethereum derivation path for a given agent index. */
export function hotWalletPath(index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`hotWalletPath: index must be a non-negative integer, got ${index}`);
  }
  return `m/44'/60'/0'/0/${index}`;
}

/**
 * Derive an agent's hot wallet from the operator's master mnemonic + index.
 *
 * @param {string} mnemonic - the operator's 12/24-word master phrase
 * @param {number} index - the per-agent index (0, 1, 2, …)
 * @returns {import("ethers").HDNodeWallet} a wallet (has .address, .signMessage)
 */
export function deriveHotWallet(mnemonic, index) {
  const phrase = (typeof mnemonic === "string" ? mnemonic : mnemonic?.phrase || "").trim();
  if (!phrase) throw new Error("deriveHotWallet: a master mnemonic is required");
  const mn = ethers.Mnemonic.fromPhrase(phrase);
  return ethers.HDNodeWallet.fromMnemonic(mn, hotWalletPath(index));
}

/** Generate a fresh random master mnemonic (12 words). */
export function generateMnemonic() {
  return ethers.Wallet.createRandom().mnemonic.phrase;
}
