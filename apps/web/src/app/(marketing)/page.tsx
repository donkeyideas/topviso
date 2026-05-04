import { AnnouncementBar } from "@/components/marketing/AnnouncementBar";
import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { LogoMarquee } from "@/components/marketing/LogoMarquee";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { Features } from "@/components/marketing/Features";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Comparison } from "@/components/marketing/Comparison";
import { CompetitorPricingTable } from "@/components/marketing/CompetitorPricingTable";
import { Pricing } from "@/components/marketing/Pricing";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Footer } from "@/components/marketing/Footer";
import { getPlanConfig } from "@/lib/plan-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Viso — App Store Optimization Intelligence",
  description:
    "The full map of how your app gets found. App Store. Play Store. ChatGPT. Claude. Gemini. Perplexity. Copilot.",
  openGraph: {
    title: "Top Viso — App Store Optimization Intelligence",
    description:
      "The full map of how your app gets found. App Store. Play Store. ChatGPT. Claude. Gemini. Perplexity. Copilot.",
    type: "website",
  },
};

export default async function HomePage() {
  const plans = await getPlanConfig();

  return (
    <>
      <AnnouncementBar />
      <Nav />
      <Hero />
      <LogoMarquee />
      <ProblemSection />
      <Features />
      <Testimonials />
      <Comparison />
      <CompetitorPricingTable />
      <Pricing plans={plans} />
      <FinalCta />
      <Footer />
    </>
  );
}
