export const GAS_PRICE_ORACLE = "0x420000000000000000000000000000000000000F" as const;

export const gasPriceOracleAbi = [
  {
    type: "function",
    name: "getL1FeeUpperBound",
    stateMutability: "view",
    inputs: [{ name: "size", type: "uint256" }],
    outputs: [{ name: "fee", type: "uint256" }],
  },
] as const;

export async function getL1FeeUpperBound(client: any, sizeBytes: bigint): Promise<bigint> {
  try {
    const res = await client.readContract({
      address: GAS_PRICE_ORACLE,
      abi: gasPriceOracleAbi as any,
      functionName: "getL1FeeUpperBound",
      args: [sizeBytes],
    });
    return BigInt(res as any);
  } catch (e) {
    console.warn("GasPriceOracle not available on this chain or failed:", e);
    return 0n;
  }
}
