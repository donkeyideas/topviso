import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const benchmarkCategories = [
  {
    label: "KEYWORD RANKINGS",
    metric: "42%",
    title: "Average keyword rankings",
    description:
      "Percentage of top-10 keyword positions held by the top three apps in each category. Concentration is increasing quarter over quarter.",
    detail: "Avg. top-3 concentration across 24 categories",
  },
  {
    label: "LLM DISCOVERY",
    metric: "17%",
    title: "LLM discovery rates",
    description:
      "Share of app-related queries where LLMs recommend a specific app by name. This number has doubled since Q3 2025.",
    detail: "Of LLM queries return a named app recommendation",
  },
  {
    label: "CVR BENCHMARKS",
    metric: "3.2%",
    title: "CVR benchmarks by category",
    description:
      "Median impression-to-install conversion rate across all categories on the App Store. Top performers see 8%+ with optimized creatives.",
    detail: "Median CVR across App Store categories",
  },
  {
    label: "CREATIVE IMPACT",
    metric: "26%",
    title: "Creative A/B test lift",
    description:
      "Average CVR lift from the first round of screenshot A/B testing. Subsequent rounds see diminishing but still meaningful returns.",
    detail: "Avg. CVR lift from first creative test cycle",
  },
  {
    label: "REVIEW SENTIMENT",
    metric: "4.1",
    title: "Average rating by category",
    description:
      "Cross-category median app rating. Apps that respond to negative reviews within 24 hours see a 0.3-star improvement over 90 days.",
    detail: "Median store rating across top 200 apps per category",
  },
  {
    label: "AGENT READINESS",
    metric: "12%",
    title: "Agent-ready app share",
    description:
      "Only 12% of top-500 apps have the structured metadata and manifest needed for AI agent installation flows.",
    detail: "Of top-500 apps are agent-ready today",
  },
];

export default function BenchmarksPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          padding: "80px 32px 64px",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
          textAlign: "center",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <div className="sec-kicker">INDUSTRY BENCHMARKS</div>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(36px, 6vw, 64px)",
              letterSpacing: "-0.035em",
              lineHeight: 1,
              marginBottom: "16px",
              color: "var(--color-ink)",
            }}
          >
            Know the <em style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic", color: "var(--color-accent)" }}>numbers</em>.
          </h1>
          <p
            className="text-ink-2 mx-auto"
            style={{ fontSize: "19px", maxWidth: "560px", lineHeight: "1.45", marginBottom: "12px" }}
          >
            Free industry benchmarks updated monthly. See where your app stands
            against the market across keywords, LLM discovery, conversion rates,
            and more.
          </p>
          <p
            className="font-mono text-ink-3"
            style={{ fontSize: "12px", letterSpacing: "0.1em" }}
          >
            LAST UPDATED: APRIL 2026
          </p>
        </div>
      </section>

      {/* Benchmark grid */}
      <section style={{ padding: "80px 32px" }}>
        <div
          className="mx-auto grid gap-5"
          style={{ maxWidth: "1280px", gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {benchmarkCategories.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-line bg-white"
              style={{ padding: "36px 32px" }}
            >
              <div
                className="font-mono text-accent mb-5"
                style={{ fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}
              >
                {b.label}
              </div>
              <div
                className="font-display text-accent"
                style={{ fontSize: "52px", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "6px" }}
              >
                {b.metric}
              </div>
              <div
                className="font-mono text-ink-3 mb-5"
                style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {b.detail}
              </div>
              <p
                className="text-ink-3"
                style={{ fontSize: "14px", lineHeight: "1.55" }}
              >
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Teaser CTA */}
      <section
        className="border-t border-line"
        style={{
          padding: "80px 32px",
          textAlign: "center",
          background: "var(--color-paper-2)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <h2
            className="text-ink mb-3"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "36px",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Get the full dataset
          </h2>
          <p
            className="text-ink-3 mb-8"
            style={{ fontSize: "16px", lineHeight: "1.5", maxWidth: "480px", margin: "0 auto 32px" }}
          >
            Start your free trial to access granular benchmarks by category,
            region, and time period. Export to CSV. Build reports your team will
            actually read.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/signup" className="btn btn-accent btn-lg">
              Start free trial &rarr;
            </a>
            <a
              href="https://calendar.app.google/QE2nZAujsJm88HUs6"
              className="btn btn-ghost btn-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
            </a>
          </div>
          <p
            className="font-mono text-ink-3 mt-4"
            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
          >
            14-DAY FREE TRIAL &middot; NO CREDIT CARD REQUIRED
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
