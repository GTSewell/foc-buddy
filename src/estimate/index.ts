import { CHAINS, ChainKey } from "@/chains";
import { getBaseFeePerGas, gweiToWei } from "@/gas/l1";
import { formatEther } from "viem";
import { getEthPrice } from "@/price/coingecko";
import { totalGasForData } from "@/estimate/sstore2";
import { totalCalldataBytes, totalL1DataFeeOpStack } from "@/estimate/opstack";

export type Fiat = "usd" | "aud";

export type EstimateRow = {
  chain: ChainKey;
  gasUsed: bigint;
  chunks: number;
  ethCostWei: bigint;
  ethCost: string; // formatted
  fiatCost: number; // computed using current price
  warnings: string[];
  baseFeePerGas?: bigint; // L1 only
  l2GasPrice?: bigint; // L2 only
  l1DataFeeWei?: bigint; // OP-Stack only
};

export type EstimateResult = {
  rows: EstimateRow[];
  ethPrice: { usd: number; aud: number };
  calldataBytes: bigint;
  constants: Record<string, number>;
};

export async function estimateForChains(data: Uint8Array, opts: { chains: ChainKey[]; tipGwei: number; fiat: Fiat; }): Promise<EstimateResult> {
  const { totalGas, chunks } = totalGasForData(data);
  const calldataBytes = totalCalldataBytes(chunks);
  const price = await getEthPrice();

  const rows: EstimateRow[] = [];

  for (const key of opts.chains) {
    const cfg = CHAINS[key];
    const warnings: string[] = [];
    let ethCostWei = 0n;
    let baseFeePerGas: bigint | undefined;
    let l2GasPrice: bigint | undefined;
    let l1DataFeeWei: bigint | undefined;

      try {
        if (cfg.isL1) {
          baseFeePerGas = await getBaseFeePerGas(cfg.client);
          const tip = gweiToWei(opts.tipGwei);
          const gasPrice = baseFeePerGas + tip;
          ethCostWei = totalGas * gasPrice;
        } else {
          // L2: total = (gas * l2GasPrice) + L1_data_component (if OP-Stack)
          l2GasPrice = await cfg.client.getGasPrice();
          let l1Fee = 0n;
          if (cfg.isOpStack) {
            l1Fee = await totalL1DataFeeOpStack(cfg.client, chunks);
            l1DataFeeWei = l1Fee;
          } else {
            warnings.push("L1 data fee not fetched for this L2; showing L2 gas only (approx)");
          }
          ethCostWei = totalGas * l2GasPrice + l1Fee;
        }
      } catch (e) {
        warnings.push(`Failed to fetch fees for ${cfg.name}: ${(e as any)?.message ?? String(e)}`);
        ethCostWei = 0n;
        baseFeePerGas = undefined;
        l2GasPrice = undefined;
        l1DataFeeWei = undefined;
      }

    const eth = Number(formatEther(ethCostWei));
    const fiatPrice = opts.fiat === "usd" ? price.usd : price.aud;
    const fiatCost = eth * fiatPrice;

    if (data.length > 5 * 1024 * 1024) {
      warnings.push("File >5MB: L1 likely impractical; consider SVG or L2");
    }

    rows.push({
      chain: key,
      gasUsed: totalGas,
      chunks: chunks.length,
      ethCostWei,
      ethCost: eth.toFixed(6),
      fiatCost,
      warnings,
      baseFeePerGas,
      l2GasPrice,
      l1DataFeeWei,
    });
  }

  return {
    rows,
    ethPrice: price,
    calldataBytes,
    constants: {
      MAX_CHUNK_BYTES: 24575,
      CREATE_BASE: 32000,
      CODE_DEPOSIT_PER_BYTE: 200,
      INITCODE_WORD_COST: 2,
    },
  };
}
