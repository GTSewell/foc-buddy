export const GAS_CONSTANTS = {
  MAX_CHUNK_BYTES: 24_575, // 24,576 code limit minus 1 STOP
  CREATE_BASE_GAS: 32_000,
  CODE_DEPOSIT_PER_BYTE: 200,
  INITCODE_WORD_COST: 2, // EIP-3860: 2 gas per 32-byte word of initcode
  INITCODE_OVERHEAD_BYTES: 11, // (chunkBytes + 11) before dividing by 32
} as const;

export function chunkData(data: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  const size = GAS_CONSTANTS.MAX_CHUNK_BYTES;
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.subarray(i, Math.min(i + size, data.length)));
  }
  return chunks;
}

export function gasForChunk(chunkLen: number): bigint {
  const codeDeposit = BigInt(GAS_CONSTANTS.CODE_DEPOSIT_PER_BYTE) * BigInt(chunkLen + 1); // include STOP
  const createBase = BigInt(GAS_CONSTANTS.CREATE_BASE_GAS);
  const words = Math.ceil((chunkLen + GAS_CONSTANTS.INITCODE_OVERHEAD_BYTES) / 32);
  const initcode = BigInt(GAS_CONSTANTS.INITCODE_WORD_COST) * BigInt(words);
  return codeDeposit + createBase + initcode;
}

export function totalGasForData(data: Uint8Array) : { totalGas: bigint; chunks: Uint8Array[] } {
  const chunks = chunkData(data);
  let total = 0n;
  for (const c of chunks) total += gasForChunk(c.length);
  return { totalGas: total, chunks };
}
