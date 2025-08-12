import { formatUnits } from "viem";

export async function getBaseFeePerGas(client: any): Promise<bigint> {
  try {
    const block = await client.getBlock();
    if (block && block.baseFeePerGas != null) return block.baseFeePerGas as bigint;
  } catch (e) {
    console.warn("Failed to get block baseFeePerGas via getBlock, falling back to getGasPrice", e);
  }
  // Fallback: use gas price as a proxy
  const gp: bigint = await client.getGasPrice();
  return gp;
}

export function gweiToWei(gwei: number): bigint {
  return BigInt(Math.round(gwei * 1_000_000_000));
}

export function formatGwei(wei: bigint): string {
  return formatUnits(wei, 9);
}
