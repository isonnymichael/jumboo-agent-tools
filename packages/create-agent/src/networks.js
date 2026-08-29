/**
 * Network presets injected into a generated agent's .env.
 * Addresses are the live Jumboo deployments (public, safe to ship).
 */
export const NETWORKS = {
  sepolia: {
    label: "Sepolia testnet (live Jumboo deployment)",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    oracleUrl: "https://oracle.jumboo.xyz",
    taskRegistry: "0xDA1110Cf8e307428159a8737E6278688974ED6B1",
    identityRegistry: "0xa4dC59378690263ff26272493F78393c2f2D57c4",
    validationRegistry: "0xBB158e80220Fd2E13CbEd191328be7B29f09b4e0",
    reputationRegistry: "0x6f0a94Fc5db3BE408DFeB7522578027426Df593A",
    x402Network: "sepolia",
    // Circle USDC (EIP-3009) — the template's built-in default; no override needed.
    usdcAddress: "",
  },
  bsctestnet: {
    label: "BSC testnet (live Jumboo deployment)",
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    oracleUrl: "https://oracle.jumboo.xyz",
    taskRegistry: "0x3273d1B9a85e5B7C76BF71CBe6A5fA0d6d7CbA6f",
    identityRegistry: "0xa76e6Fc884a4734608546cF5dB838143b5dcf92F",
    validationRegistry: "0xD32a3B0fe151DB49Ae6f1622126630A015Ed3350",
    reputationRegistry: "0xAd820D182aAA01734C48c1844335452A76b02dE0",
    x402Network: "bscTestnet",
    // BSC-testnet USDC — no EIP-3009, so hires settle via approve+transferFrom
    // (the template picks that flavor automatically from HIRE_PRICE_NETWORK).
    usdcAddress: "0x64544969ed7EBf5f083679233325356EbE738930",
  },
};

export const DEFAULT_NETWORK = "sepolia";
