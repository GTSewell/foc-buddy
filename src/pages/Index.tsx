import Estimator from "@/components/Estimator";
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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Onchain Storage Cost Estimator (SSTORE2)</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Fast, client-side cost estimates for storing your media fully on-chain using SSTORE2. Perfect for artists comparing L1 and L2s.</p>
      </header>
      <main>
        <Estimator />
      </main>
    </>
  );
};

export default Index;
