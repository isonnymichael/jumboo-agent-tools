/**
 * Network presets injected into a generated agent's .env.
 * Sepolia addresses are the live Jumboo deployment (public, safe to ship).
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
  }
};

export const DEFAULT_NETWORK = "sepolia";
