import { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';

const FramedApp = lazy(() => import('@/framed/App')); // we'll paste App later

export default function FramedPage() {
  return (
    <>
      <Helmet>
        <title>FRAMED - Frame Extractor | Buddy</title>
        <meta name="description" content="Extract frames from videos with precision. Upload videos and extract individual frames using advanced frame extraction technology." />
        <link rel="canonical" href="/framed" />
        <meta property="og:title" content="FRAMED - Frame Extractor" />
        <meta property="og:description" content="Extract frames from videos with precision using advanced frame extraction technology." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-semibold mb-4">FRAMED — Frame Extractor</h1>
          <Suspense fallback={<div>Loading FRAMED…</div>}>
            <FramedApp />
          </Suspense>
        </div>
      </div>
    </>
  );
}