import { createPublicClient, http, fallback } from "viem";
import { mainnet, base, zora, optimism, arbitrum } from "viem/chains";

export type ChainKey = "ethereum" | "base" | "zora" | "optimism" | "arbitrum";

export type ChainConfig = {
  key: ChainKey;
  name: string;
  id: number;
  client: any; // relaxed typing to avoid cross-chain generic incompatibilities
  isL1: boolean;
  isOpStack: boolean;
};

const rpc = {
  ethereum: "https://cloudflare-eth.com",
  base: "https://mainnet.base.org",
  zora: "https://rpc.zora.energy",
  optimism: "https://mainnet.optimism.io",
  arbitrum: "https://arb1.arbitrum.io/rpc",
} as const;

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: "ethereum",
    name: "Ethereum",
    id: mainnet.id,
    client: createPublicClient({
      chain: mainnet,
      transport: fallback([
        http(rpc.ethereum),
        http("https://rpc.ankr.com/eth"),
        http("https://eth.llamarpc.com"),
        http("https://rpc.flashbots.net"),
      ]),
    }),
    isL1: true,
    isOpStack: false,
  },
  base: {
    key: "base",
    name: "Base",
    id: base.id,
    client: createPublicClient({ chain: base, transport: http(rpc.base) }),
    isL1: false,
    isOpStack: true,
  },
  zora: {
    key: "zora",
    name: "Zora",
    id: zora.id,
    client: createPublicClient({ chain: zora, transport: http(rpc.zora) }),
    isL1: false,
    isOpStack: true,
  },
  optimism: {
    key: "optimism",
    name: "Optimism",
    id: optimism.id,
    client: createPublicClient({ chain: optimism, transport: http(rpc.optimism) }),
    isL1: false,
    isOpStack: true,
  },
  arbitrum: {
    key: "arbitrum",
    name: "Arbitrum",
    id: arbitrum.id,
    client: createPublicClient({ chain: arbitrum, transport: http(rpc.arbitrum) }),
    isL1: false,
    isOpStack: false, // Arbitrum is Nitro, not OP-Stack
  },
};

export const ALL_CHAIN_KEYS: ChainKey[] = [
  "ethereum",
  "base",
  "zora",
  "optimism",
  "arbitrum",
];

export const CHAIN_LABELS: Record<ChainKey, string> = {
  ethereum: "Ethereum",
  base: "Base",
  zora: "Zora",
  optimism: "Optimism",
  arbitrum: "Arbitrum",
};
