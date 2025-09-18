import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

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
      "image/png","image/jpeg","image/gif","image/webp","image/svg+xml","video/mp4"
    ];
    if (!okTypes.includes(f.type)) {
      toast({ title: "Unsupported file", description: "Please use PNG/JPG/GIF/WebP/SVG/MP4" });
      return;
    }
    
    // Reset previous calculations when new file is uploaded
    setLoading(false);
    setRows(null);
    
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
      setRows(null);  // Clear previous results to avoid currency mismatch
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

  // Simulate realistic progress stages
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setProgressMessage("");
      return;
    }
    
    let currentStage = 0;
    const stages = [
      { progress: 10, message: "Initializing calculation..." },
      { progress: 20, message: "Fetching ETH prices..." },
      { progress: 30, message: `Processing ${selectedChains.length} chain${selectedChains.length > 1 ? 's' : ''}...` },
      { progress: 50, message: "Fetching gas prices..." },
      { progress: 70, message: "Calculating L1 data fees..." },
      { progress: 90, message: "Computing final costs..." },
      { progress: 95, message: "Finalizing results..." }
    ];
    
    const progressInterval = setInterval(() => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setProgress(stage.progress);
        setProgressMessage(stage.message);
        currentStage++;
      }
    }, 500);
    
    return () => clearInterval(progressInterval);
  }, [loading, selectedChains.length]);

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
          <p className="text-amber-600 dark:text-amber-400 text-sm font-medium mt-2">
            ⚠️ Currently in Beta testing. Estimated gas values may be wrong ⚠️
          </p>
        </CardHeader>
        <CardContent>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 mb-6 text-center"
          >
            <input ref={inputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4" onChange={(e) => onFiles(e.target.files)} />
            <p className="mb-3">Drag & drop PNG/JPG/GIF/WebP/SVG/MP4 here</p>
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
                          className={active 
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                            : "bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
                          }
                          onClick={() => setSelectedChains((prev) => prev.includes(k) ? prev.filter(x => x!==k) : [...prev, k])}
                        >
                          {active && <Check className="w-4 h-4 mr-2" />}
                          {CHAIN_LABELS[k]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-medium flex items-center gap-2">
                    L1 priority tip (gwei): {tip}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center rounded-full w-4 h-4 text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="w-3 h-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <p className="font-medium">L1 priority tip: Basically the lower the slower.</p>
                          <p className="text-sm text-muted-foreground">
                            The L1 priority tip is a small extra amount you add on top of Ethereum's automatic base fee to reward the validator for including your transaction sooner. The base fee is burned (nobody keeps it); the tip is paid to the validator.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            A higher tip can speed up confirmation during busy periods, but it doesn't change how much gas your transaction uses—it only affects how fast it gets picked. For most mints, ~1 gwei is fine; bump to 2–3 gwei if you need it included quickly. (Under the hood this is maxPriorityFeePerGas in EIP-1559.)
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
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

          {loading && (
            <div className="mt-6 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressMessage || "Starting calculation..."}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
