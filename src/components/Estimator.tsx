import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CHAIN_LABELS, ALL_CHAIN_KEYS, ChainKey } from "@/chains";
import { readFileBytes, buildMediaMeta, minifySvgIfNeeded, MediaMeta } from "@/media/intake";
import { estimateForChains, Fiat } from "@/estimate";
import { formatEther } from "viem";

function bytesToPretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(2)} KB`;
  return `${(n/1024/1024).toFixed(2)} MB`;
}

export default function Estimator() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Uint8Array | null>(null);
  const [meta, setMeta] = useState<MediaMeta | null>(null);
  const [svgMinify, setSvgMinify] = useState(false);
  const [minifiedBytes, setMinifiedBytes] = useState<Uint8Array | null>(null);
  const [selectedChains, setSelectedChains] = useState<ChainKey[]>([...ALL_CHAIN_KEYS]);
  const [tip, setTip] = useState<number>(1);
  const [fiat, setFiat] = useState<Fiat>("usd");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof estimateForChains>> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveBytes = useMemo(() => {
    if (!data) return null;
    if (svgMinify && minifiedBytes) return minifiedBytes;
    return data;
  }, [data, svgMinify, minifiedBytes]);

  const onFiles = useCallback(async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const okTypes = [
      "image/png","image/jpeg","image/gif","image/svg+xml","video/mp4"
    ];
    if (!okTypes.includes(f.type)) {
      toast({ title: "Unsupported file", description: "Please use PNG/JPG/GIF/SVG/MP4" });
      return;
    }
    setFile(f);
    const b = await readFileBytes(f);
    setData(b);
    const m = await buildMediaMeta(f, b);
    setMeta(m);
    setSvgMinify(false);
    setMinifiedBytes(null);
  }, [toast]);

  useEffect(() => {
    if (!file || !file.type.includes("svg")) return;
    (async () => {
      if (svgMinify) {
        const mb = await minifySvgIfNeeded(file, true);
        setMinifiedBytes(mb);
      } else {
        setMinifiedBytes(null);
      }
    })();
  }, [file, svgMinify]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!effectiveBytes) return;
      setLoading(true);
      try {
        const res = await estimateForChains(effectiveBytes, { chains: selectedChains, tipGwei: tip, fiat });
        if (!cancelled) setRows(res);
      } catch (e: any) {
        console.error(e);
        toast({ title: "Estimation failed", description: e?.message || "Please try again" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveBytes, selectedChains, tip, fiat, toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  const onBrowse = () => inputRef.current?.click();

  const warning = meta && meta.bytes > 5*1024*1024 ? "File >5MB: L1 likely impractical; consider SVG or L2" : null;

  return (
    <div className="container py-10">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Onchain Storage Cost Estimator (SSTORE2)</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 mb-6 text-center"
          >
            <input ref={inputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/gif,image/svg+xml,video/mp4" onChange={(e) => onFiles(e.target.files)} />
            <p className="mb-3">Drag & drop PNG/JPG/GIF/SVG/MP4 here</p>
            <Button variant="secondary" onClick={onBrowse}>Browse file</Button>
          </div>

          {file && meta && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center aspect-video">
                  {file.type === "video/mp4" ? (
                    <video src={URL.createObjectURL(file)} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="uploaded preview" className="w-full h-full object-contain" loading="lazy" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{meta.mime || "unknown"}</Badge>
                  <Badge variant="outline">{bytesToPretty(meta.bytes)}</Badge>
                  {meta.width && meta.height && (
                    <Badge variant="outline">{meta.width}×{meta.height}px</Badge>
                  )}
                  {meta.duration && (
                    <Badge variant="outline">{meta.duration.toFixed(2)}s</Badge>
                  )}
                  {meta.gzipBytes ? (
                    <Badge variant="secondary">gzip {bytesToPretty(meta.gzipBytes)}</Badge>
                  ) : null}
                </div>
                {file.type.includes("svg") && (
                  <div className="flex items-center gap-3">
                    <Switch id="svgo" checked={svgMinify} onCheckedChange={setSvgMinify} />
                    <label htmlFor="svgo">SVGO minify</label>
                    {svgMinify && minifiedBytes && (
                      <span className="text-sm text-muted-foreground">→ {bytesToPretty(minifiedBytes.length)}</span>
                    )}
                  </div>
                )}
                {warning && <div className="text-sm text-destructive">{warning}</div>}
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-2 font-medium">Chains</div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CHAIN_KEYS.map((k) => {
                      const active = selectedChains.includes(k);
                      return (
                        <Button
                          key={k}
                          type="button"
                          variant={active ? "default" : "outline"}
                          onClick={() => setSelectedChains((prev) => prev.includes(k) ? prev.filter(x => x!==k) : [...prev, k])}
                        >
                          {CHAIN_LABELS[k]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-medium">L1 priority tip (gwei): {tip}</div>
                  <Slider value={[tip]} onValueChange={(v) => setTip(v[0] ?? 0)} min={0} max={5} step={0.1} />
                </div>

                <div>
                  <div className="mb-2 font-medium">Fiat</div>
                  <Select value={fiat} onValueChange={(v) => setFiat(v as Fiat)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Fiat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="aud">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {rows && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chain</TableHead>
                      <TableHead>ETH</TableHead>
                      <TableHead>{fiat.toUpperCase()}</TableHead>
                      <TableHead>gasUsed</TableHead>
                      <TableHead>#chunks</TableHead>
                      <TableHead>notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.rows.map((r) => (
                      <TableRow key={r.chain}>
                        <TableCell>{CHAIN_LABELS[r.chain]}</TableCell>
                        <TableCell>{r.ethCost}</TableCell>
                        <TableCell>{r.fiatCost.toFixed(2)}</TableCell>
                        <TableCell>{r.gasUsed.toString()}</TableCell>
                        <TableCell>{r.chunks}</TableCell>
                        <TableCell>
                          {r.warnings.map((w, i) => (
                            <div key={i} className="text-xs text-muted-foreground">{w}</div>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="dev">
                  <AccordionTrigger>Dev details</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <div>ETH price: USD {rows.ethPrice.usd.toFixed(2)} | AUD {rows.ethPrice.aud.toFixed(2)}</div>
                        <div>calldata bytes: {rows.calldataBytes.toString()}</div>
                        <div>constants: maxChunk {rows.constants.MAX_CHUNK_BYTES}, createBase {rows.constants.CREATE_BASE}, codeDeposit/byte {rows.constants.CODE_DEPOSIT_PER_BYTE}, initcodeWordCost {rows.constants.INITCODE_WORD_COST}</div>
                      </div>
                      <div className="space-y-2">
                        {rows.rows.map((r) => (
                          <div key={r.chain} className="flex items-center justify-between">
                            <div className="font-medium">{CHAIN_LABELS[r.chain]}</div>
                            <div className="text-muted-foreground">
                              {r.baseFeePerGas ? (<span>baseFee {r.baseFeePerGas.toString()} wei</span>) : null}
                              {r.l2GasPrice ? (<span> l2GasPrice {r.l2GasPrice.toString()} wei</span>) : null}
                              {r.l1DataFeeWei ? (<span> l1DataFee {r.l1DataFeeWei.toString()} wei</span>) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {loading && <div className="mt-4 text-sm text-muted-foreground">Calculating...</div>}
        </CardContent>
      </Card>
    </div>
  );
}
