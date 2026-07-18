#!/usr/bin/env node
/**
 * Register this agent on-chain: mint the JumbooIdentityRegistry NFT to the
 * OPERATOR wallet, with the hot wallet as the registered signer.
 *
 *   npm run register
 *
 * Reads .env directly (it must run BEFORE AGENT_ID exists, so it does not use
 * src/config.js, which requires AGENT_ID). On success it prints the new agentId
 * and reminds you to write it into .env.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { ethers } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, "..", ".env") });

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

const rpcUrl = required("RPC_URL");
const identityRegistry = required("IDENTITY_REGISTRY_ADDRESS");
const operatorKey = required("OPERATOR_KEY"); // owns the NFT, pays gas
const hotKey = required("AGENT_HOT_KEY"); // the registered signer

const provider = new ethers.JsonRpcProvider(rpcUrl);
const operator = new ethers.Wallet(operatorKey, provider);
const agentWallet = new ethers.Wallet(hotKey).address;

// Build ERC-8004 registration metadata as a base64 data URI.
function buildAgentUri() {
  let skills = [];
  try {
    skills = JSON.parse(process.env.AGENT_SKILLS || "[]");
  } catch {
    skills = String(process.env.AGENT_SKILLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  const backendUrl = (process.env.BACKEND_URL || "").replace(/\/+$/, "");
  const metadata = {
    type: "AgentCard",
    name: process.env.AGENT_NAME || "jumboo-agent",
    active: true,
    agentWallet,
    backendUrl,
    endpoints: { solve: backendUrl ? `${backendUrl}/solve` : "" },
    skills,
    pricing: {
      solve: {
        amount: process.env.HIRE_PRICE_AMOUNT || "0.50",
        asset: process.env.HIRE_PRICE_ASSET || "USDC",
        network: process.env.HIRE_PRICE_NETWORK || "sepolia",
      },
    },
  };
  const json = JSON.stringify(metadata);
  return `data:application/json;base64,${Buffer.from(json, "utf8").toString("base64")}`;
}

const ABI = [
  "function registerAgent(address agentWallet, string agentURI) external returns (uint256 agentId)",
  "event AgentRegistered(uint256 indexed agentId, address indexed operatorWallet, address indexed agentWallet, string agentURI)",
];

const registry = new ethers.Contract(identityRegistry, ABI, operator);

console.log(`Registering agent…`);
console.log(`  operator (NFT owner): ${operator.address}`);
console.log(`  agent hot wallet:     ${agentWallet}`);

const tx = await registry.registerAgent(agentWallet, buildAgentUri());
console.log(`  tx: ${tx.hash} — waiting for confirmation…`);
const receipt = await tx.wait();

let agentId = null;
for (const log of receipt.logs) {
  try {
    const parsed = registry.interface.parseLog(log);
    if (parsed?.name === "AgentRegistered") agentId = parsed.args.agentId;
  } catch {}
}
if (agentId === null) throw new Error("AgentRegistered event not found — check the registry address/network");

console.log(`\n✓ Registered. agentId = ${agentId}`);
console.log(`\n  Now set this in your .env:`);
console.log(`    AGENT_ID=${agentId}\n`);
