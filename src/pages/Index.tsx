import Estimator from "@/components/Estimator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const title = "Onchain Storage Cost Estimator – SSTORE2 for Ethereum & L2s";
  const description = "Estimate the ETH and USD/AUD cost to store media fully on-chain with SSTORE2 across Ethereum, Base, Zora, Optimism, and Arbitrum.";
  const canonical = "/";

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
      </Helmet>
      <header className="container pt-10 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Onchain Storage Cost Estimator (SSTORE2)</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">Fast, client-side cost estimates for storing your media fully on-chain using SSTORE2. Perfect for artists comparing L1 and L2s.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Built by{" "}
              <a 
                href="https://x.com/GTSewell" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                GT
              </a>
              {" / "}
              <a 
                href="https://x.com/_247art" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                247ART
              </a>
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm relative z-10">
          <a 
            href="https://svgo.dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer pointer-events-auto"
          >
            Optimize SVGs with SVGO →
          </a>
          <a 
            href="https://www.fullyonchain.art/articles/fully-on-chain-svg-nfts-rendering" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer pointer-events-auto"
          >
            Fully On-Chain SVG Guide →
          </a>
          <a 
            href="https://onchainchecker.xyz/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer pointer-events-auto"
          >
            OnChain Checker →
          </a>
          <a 
            href="https://compressjpeg.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 cursor-pointer pointer-events-auto"
          >
            Compress JPEGs →
          </a>
        </div>
      </header>
      <main>
        <Estimator />
      </main>
    </>
  );
};

export default Index;
