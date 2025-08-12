import { GAS_CONSTANTS } from "./sstore2";
import { getL1FeeUpperBound } from "@/gas/oracle";

export function calldataSizeForChunkBytes(chunkLen: number): bigint {
  // selector(4) + offset(32) + len(32) + 32 * ceil(chunkLen/32)
  const words = Math.ceil(chunkLen / 32);
  return BigInt(4 + 32 + 32 + 32 * words);
}

export function totalCalldataBytes(chunks: Uint8Array[]): bigint {
  return chunks.reduce((acc, c) => acc + calldataSizeForChunkBytes(c.length), 0n);
}

export async function totalL1DataFeeOpStack(client: any, chunks: Uint8Array[]): Promise<bigint> {
  // sum oracle fee per-chunk
  let total = 0n;
  for (const c of chunks) {
    const size = calldataSizeForChunkBytes(c.length);
    const fee = await getL1FeeUpperBound(client, size);
    total += fee;
  }
  return total;
}
