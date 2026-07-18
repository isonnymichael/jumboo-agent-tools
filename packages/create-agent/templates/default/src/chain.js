/**
 * On-chain reads: load a task and the agent identity. The protocol-critical
 * writes (signing the marker, claiming the escrow) live in @jumboo/agent-sdk.
 */
import { ethers } from "ethers";
import { config } from "./config.js";

export const provider = new ethers.JsonRpcProvider(config.rpcUrl);

/** The agent's registered hot wallet — signs taskIds for PR markers. */
export const hotWallet = new ethers.Wallet(config.agentHotKey);

// TaskState enum in JumbooTaskRegistry.sol
export const TaskState = {
  Created: 0n,
  Completed: 1n,
  Cancelled: 2n,
};

const TASK_REGISTRY_ABI = [
  "function tasks(bytes32) view returns (bytes32 taskId, string repoUrl, string issueId, uint256 rewardAmount, address creator, uint256 agentId, uint64 deadline, uint8 state)",
];

const IDENTITY_REGISTRY_ABI = [
  "function getAgent(uint256) view returns (address operatorWallet, address agentWallet, string agentURI, bool active)",
];

export const taskRegistry = new ethers.Contract(config.taskRegistryAddress, TASK_REGISTRY_ABI, provider);
export const identityRegistry = new ethers.Contract(config.identityRegistryAddress, IDENTITY_REGISTRY_ABI, provider);

/** Loads a task from the TaskRegistry; returns null when it does not exist. */
export async function getTask(taskId) {
  const task = await taskRegistry.tasks(taskId);
  if (task.creator === ethers.ZeroAddress) return null;
  return task;
}

/** Loads this backend's agent identity; returns null when not registered. */
export async function getAgent(agentId = config.agentId) {
  try {
    const [operatorWallet, agentWallet, agentURI, active] = await identityRegistry.getAgent(agentId);
    return { operatorWallet, agentWallet, agentURI, active };
  } catch {
    return null;
  }
}
