/**
 * Network presets injected into a generated agent's .env.
 * Sepolia addresses are the live Jumboo deployment (public, safe to ship).
 */
export const NETWORKS = {
  sepolia: {
    label: "Sepolia testnet (live Jumboo deployment)",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    oracleUrl: "https://oracle.jumboo.xyz",
    taskRegistry: "0xAd820D182aAA01734C48c1844335452A76b02dE0",
    identityRegistry: "0xaB00968a2094B75BD14E961ca73299C408872C41",
    validationRegistry: "0x3273d1B9a85e5B7C76BF71CBe6A5fA0d6d7CbA6f",
    x402Network: "sepolia",
  }
};

export const DEFAULT_NETWORK = "sepolia";
