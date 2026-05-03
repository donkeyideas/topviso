import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const pillars = [
  {
    title: "Bayesian MMM",
    description:
      "Marketing Mix Modelling that actually works for mobile. Our Bayesian model decomposes your install volume by channel, accounting for organic lift, seasonality, and cross-channel effects.",
    metric: "Bayesian",
    metricLabel: "MARKETING MIX MODEL",
  },
  {
    title: "Geo holdouts",
    description:
      "Run incrementality tests by holding out geographic regions from specific campaigns. Measure the true incremental impact of each channel without relying on last-touch attribution.",
    metric: "Causal",
    metricLabel: "INCREMENTALITY TESTS",
  },
  {
    title: "LLM referral tracking",
    description:
      "For the first time, measure installs that originated from an AI recommendation. Connect LLM Tracker visibility data to actual install outcomes and attribute revenue to AI surfaces.",
    metric: "AI",
    metricLabel: "REFERRAL ATTRIBUTION",
  },
];

const capabilities = [
  {
    title: "Cross-surface attribution",
    description:
      "Attribute installs across all 7 surfaces \u2014 including LLM referrals. See which surfaces drive discovery and which drive conversion, even when users cross between them.",
  },
  {
    title: "Real CAC measurement",
    description:
      "Stop reporting attributed CAC that makes your Facebook campaigns look profitable. Measure actual cost of acquisition including organic cannibalisation.",
  },
  {
    title: "Channel decomposition",
    description:
      "Break down your install volume by channel contribution. See how much is truly organic, how much is paid lift, and how much is AI-driven discovery.",
  },
  {
    title: "Budget optimisation",
    description:
      "Use MMM outputs to optimise budget allocation across channels. See where your next dollar drives the most incremental installs.",
  },
  {
    title: "Lift analysis",
    description:
      "Measure the incremental lift of individual campaigns, creative changes, or metadata updates. Quantify the ROI of your ASO efforts.",
  },
  {
    title: "Reporting & exports",
    description:
      "Pre-built dashboards for weekly and monthly attribution reports. Export to CSV, connect via API, or push to your data warehouse via webhooks.",
  },
];

export default function AttributionPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-line"
        style={{
          padding: "80px 32px 64px",
          textAlign: "center",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[-100px]"
          style={{
            transform: "translateX(-50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(29,63,217,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="relative mx-auto px-8"
          style={{ maxWidth: "1100px" }}
        >
          <div className="sec-kicker">ATTRIBUTION</div>
          <h2 className="sec-h2">
            Know your <em>real</em> CAC.
            <br />
            Not the fantasy.
          </h2>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "720px",
              lineHeight: "1.45",
              marginBottom: "40px",
            }}
          >
            Bayesian MMM + geo holdouts + LLM referral tracking. The first
            attribution system that includes AI-driven discovery in the model.
            Measure what actually drives installs.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a href="/signup" className="btn btn-accent btn-xl">
              Start free trial →
            </a>
            <a
              href="https://calendar.app.google/QE2nZAujsJm88HUs6"
              className="btn btn-ghost btn-xl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-n">
            <em>MMM</em>
          </div>
          <div className="stat-l">BAYESIAN MODEL</div>
        </div>
        <div className="stat">
          <div className="stat-n">7</div>
          <div className="stat-l">SURFACES ATTRIBUTED</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>Geo</em>
          </div>
          <div className="stat-l">HOLDOUT TESTING</div>
        </div>
        <div className="stat">
          <div className="stat-n">Real</div>
          <div className="stat-l">CAC MEASUREMENT</div>
        </div>
      </div>

      {/* Three pillars */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">THREE PILLARS</div>
          <h2 className="sec-h2">
            Attribution that <em>works</em>.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Last-touch attribution is broken. Probabilistic matching is theatre.
            We use three complementary methods to give you the truth.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {pillars.map((pillar) => (
            <div key={pillar.title} className="feature-card feature-card-hl">
              <h3
                className="mb-3 font-bold leading-[1.15]"
                style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
              >
                {pillar.title}
              </h3>
              <p
                className="mb-5 flex-1 text-paper-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {pillar.description}
              </p>
              <div className="feat-metric feat-metric-hl">
                {pillar.metric}
              </div>
              <div className="feat-metric-label feat-metric-label-hl">
                {pillar.metricLabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why last-touch fails */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto grid items-center gap-16"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div>
            <div className="sec-kicker">THE PROBLEM</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Last-touch is a{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                lie
              </em>
              .
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              A user sees your app recommended by Claude, searches for it on
              the App Store, then clicks a branded Google Ad. Last-touch
              attributes the install to Google Ads. Your AI visibility gets
              zero credit.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Bayesian MMM solves this by modelling the contribution of every
                channel simultaneously.
              </strong>{" "}
              Geo holdouts validate the model with causal experiments. LLM
              referral tracking adds the AI surface to the equation.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Questions about attribution methodology? Reach out at{" "}
              <a
                href="mailto:info@donkeyideas.com"
                className="text-accent font-medium"
              >
                info@donkeyideas.com
              </a>
              .
            </p>
          </div>

          {/* Channel decomposition example */}
          <div
            style={{
              background: "var(--color-ink)",
              borderRadius: "16px",
              padding: "36px 32px",
              color: "var(--color-paper)",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "var(--color-ink-4)",
                marginBottom: "20px",
              }}
            >
              SAMPLE · CHANNEL DECOMPOSITION
            </div>
            {[
              { channel: "Organic (App Store Search)", pct: "34%", bar: 34 },
              { channel: "LLM Referrals", pct: "18%", bar: 18 },
              { channel: "Paid (Google UAC)", pct: "22%", bar: 22 },
              { channel: "Paid (Apple Search Ads)", pct: "14%", bar: 14 },
              { channel: "Social / Referral", pct: "8%", bar: 8 },
              { channel: "Organic (Play Store)", pct: "4%", bar: 4 },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #2a2a28",
                }}
              >
                <div
                  className="mb-2 flex items-center justify-between"
                  style={{ fontSize: "14px" }}
                >
                  <span style={{ color: "var(--color-paper-3)" }}>
                    {row.channel}
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: "#6dd48e" }}
                  >
                    {row.pct}
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "#2a2a28",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${row.bar * 2.5}%`,
                      height: "100%",
                      background:
                        row.channel === "LLM Referrals"
                          ? "var(--color-accent)"
                          : "#6dd48e",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            ))}
            <div
              className="mt-4 font-mono"
              style={{
                fontSize: "11px",
                color: "var(--color-accent)",
                letterSpacing: "0.08em",
              }}
            >
              LLM REFERRALS · 18% OF INSTALLS · PREVIOUSLY UNTRACKED
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">CAPABILITIES</div>
          <h2 className="sec-h2">
            Full <em>attribution</em> stack.
          </h2>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {capabilities.map((cap) => (
            <div key={cap.title} className="feature-card" style={{ minHeight: "auto" }}>
              <h3
                className="mb-3 font-bold text-ink"
                style={{ fontSize: "20px", letterSpacing: "-0.02em" }}
              >
                {cap.title}
              </h3>
              <p
                className="text-ink-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
          <h2 className="final-cta-h2">
            Measure what <em>actually</em>
            <br />
            drives installs.
          </h2>
          <p
            className="mx-auto mb-11"
            style={{
              fontSize: "22px",
              color: "var(--color-paper-3)",
              maxWidth: "700px",
              lineHeight: "1.4",
            }}
          >
            Bayesian MMM + geo holdouts + LLM referral tracking. Available on
            Enterprise plans. 14-day free trial includes Attribution preview.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a href="/signup" className="btn btn-accent btn-xl">
              Start free trial →
            </a>
            <a
              href="https://calendar.app.google/QE2nZAujsJm88HUs6"
              className="btn btn-ghost btn-xl"
              style={{
                color: "var(--color-paper)",
                border: "1px solid #3a3a36",
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
            </a>
          </div>
          <div
            className="mt-9 font-mono"
            style={{
              fontSize: "12px",
              letterSpacing: "0.1em",
              color: "var(--color-ink-4)",
            }}
          >
            QUESTIONS? EMAIL{" "}
            <a
              href="mailto:info@donkeyideas.com"
              style={{ color: "var(--color-accent)" }}
            >
              INFO@DONKEYIDEAS.COM
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
