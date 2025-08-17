// Gas price caching to speed up calculations
type GasPriceCache = {
  [chainKey: string]: {
    baseFeePerGas?: bigint;
    l2GasPrice?: bigint;
    timestamp: number;
  }
};

const cache: GasPriceCache = {};
const TTL = 30_000; // 30 seconds cache for gas prices

export function getCachedGasPrice(chainKey: string): { baseFeePerGas?: bigint; l2GasPrice?: bigint } | null {
  const entry = cache[chainKey];
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > TTL) {
    delete cache[chainKey];
    return null;
  }
  
  return { baseFeePerGas: entry.baseFeePerGas, l2GasPrice: entry.l2GasPrice };
}

export function setCachedGasPrice(chainKey: string, data: { baseFeePerGas?: bigint; l2GasPrice?: bigint }): void {
  cache[chainKey] = {
    ...data,
    timestamp: Date.now()
  };
}