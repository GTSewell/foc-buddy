export default function App() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-muted-foreground">
        FRAMED placeholder — I'll paste the working extractor UI and logic here.
      </p>
      <ul className="mt-2 text-sm text-muted-foreground list-disc ml-5">
        <li>Paste ImageDecoder extractor (main-thread) in <code className="bg-muted px-1 rounded">src/framed/lib/extractImage.ts</code>.</li>
        <li>Paste FFmpeg worker code in <code className="bg-muted px-1 rounded">src/framed/workers/ffmpeg.worker.ts</code>.</li>
        <li>Ensure <code className="bg-muted px-1 rounded">/public/ffmpeg/ffmpeg-core.(js|wasm)</code> exist (ESM).</li>
      </ul>
    </div>
  );
}