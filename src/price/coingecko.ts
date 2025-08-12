let cache: { ts: number; usd: number; aud: number } | null = null;
const TTL = 60_000; // 1 minute

export async function getEthPrice(): Promise<{ usd: number; aud: number }> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return { usd: cache.usd, aud: cache.aud };
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,aud";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch price");
  const json = await res.json();
  const usd = json?.ethereum?.usd ?? 0;
  const aud = json?.ethereum?.aud ?? 0;
  cache = { ts: now, usd, aud };
  return { usd, aud };
}
