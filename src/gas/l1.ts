import { formatUnits } from "viem";

export async function getBaseFeePerGas(client: any): Promise<bigint> {
  // Try latest block
  try {
    const block = await client.getBlock();
    if (block && block.baseFeePerGas != null) return block.baseFeePerGas as bigint;
  } catch (e) {
    console.warn("getBlock failed for baseFeePerGas", e);
  }
  // Try feeHistory last baseFee
  try {
    const fh = await client.getFeeHistory({
      blockCount: 1,
      rewardPercentiles: [],
    } as any);
    const arr = (fh as any)?.baseFeePerGas as readonly bigint[] | undefined;
    if (arr && arr.length > 0) return arr[arr.length - 1];
  } catch (e) {
    console.warn("getFeeHistory failed for baseFeePerGas", e);
  }
  // Fallback: use gas price as a proxy
  try {
    const gp: bigint = await client.getGasPrice();
    return gp;
  } catch (e) {
    console.error("getGasPrice failed; returning 0n as last resort", e);
    return 0n;
  }
}

export function gweiToWei(gwei: number): bigint {
  return BigInt(Math.round(gwei * 1_000_000_000));
}

export function formatGwei(wei: bigint): string {
  return formatUnits(wei, 9);
}
