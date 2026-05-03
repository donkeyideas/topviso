import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const coreFeatures = [
  {
    title: "Predictive rating risk",
    description:
      "Our model analyses review velocity, sentiment trends, and competitor movements to predict when your rating is at risk of dropping. Get alerted before it happens, not after.",
    metric: "Predictive",
    metricLabel: "RATING FORECASTING",
  },
  {
    title: "Sentiment clustering",
    description:
      "Reviews are automatically grouped by topic and sentiment. See which features users love, which ones frustrate them, and which bugs are driving the most negative reviews.",
    metric: "NLP",
    metricLabel: "TOPIC CLUSTERING",
  },
  {
    title: "Auto-routing",
    description:
      "Critical reviews automatically create tickets in Linear or Jira. Route bug reports to engineering, feature requests to product, and complaints to support \u2014 without lifting a finger.",
    metric: "Auto",
    metricLabel: "LINEAR / JIRA ROUTING",
  },
];

const capabilities = [
  {
    title: "Response management",
    description:
      "Draft and publish review responses directly from Top Viso. Use AI-assisted response templates that adapt to the review\u2019s sentiment, topic, and language.",
  },
  {
    title: "Rating trend analysis",
    description:
      "Track your rating over time with daily granularity. See how app updates, bug fixes, or market events impact your rating across both stores.",
  },
  {
    title: "Competitor review monitoring",
    description:
      "Monitor competitor reviews to spot their weaknesses. When their users complain about missing features you have, you know exactly how to position your app.",
  },
  {
    title: "Review velocity alerts",
    description:
      "Get notified when review volume spikes \u2014 positive or negative. Sudden drops in review quality often correlate with buggy releases.",
  },
  {
    title: "Multi-language support",
    description:
      "Sentiment analysis and clustering works across 40+ languages. Auto-translate reviews to English for your team while preserving the original for responses.",
  },
  {
    title: "Slack & Teams notifications",
    description:
      "Get real-time notifications in your team channels for critical reviews, rating changes, and sentiment shifts. Stay informed without checking a dashboard.",
  },
];

export default function ReviewsPlusPage() {
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
          <div className="sec-kicker">REVIEWS+</div>
          <h2 className="sec-h2">
            Ship fixes <em>before</em>
            <br />
            ratings drop.
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
            Predictive rating risk. Sentiment clustering. Auto-routing to
            Linear and Jira. Stop reacting to bad reviews \u2014 start preventing
            them.
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
            <em>40+</em>
          </div>
          <div className="stat-l">LANGUAGES SUPPORTED</div>
        </div>
        <div className="stat">
          <div className="stat-n">Auto</div>
          <div className="stat-l">TICKET ROUTING</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>NLP</em>
          </div>
          <div className="stat-l">SENTIMENT ANALYSIS</div>
        </div>
        <div className="stat">
          <div className="stat-n">24/7</div>
          <div className="stat-l">MONITORING</div>
        </div>
      </div>

      {/* Core features */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">CORE FEATURES</div>
          <h2 className="sec-h2">
            Reviews as a <em>product signal</em>.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Reviews aren&apos;t just feedback \u2014 they&apos;re a real-time product signal.
            Reviews+ turns them into actionable tickets, rating forecasts, and
            competitive intelligence.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {coreFeatures.map((feature) => (
            <div
              key={feature.title}
              className="feature-card feature-card-hl"
            >
              <h3
                className="mb-3 font-bold leading-[1.15]"
                style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
              >
                {feature.title}
              </h3>
              <p
                className="mb-5 flex-1 text-paper-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {feature.description}
              </p>
              <div className="feat-metric feat-metric-hl">
                {feature.metric}
              </div>
              <div className="feat-metric-label feat-metric-label-hl">
                {feature.metricLabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How auto-routing works */}
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
            <div className="sec-kicker">AUTO-ROUTING</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Reviews become{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                tickets
              </em>
              .
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              When a user reports a crash in a review, Reviews+ detects the
              bug report, creates a Linear or Jira ticket, tags it with the
              right priority, and assigns it to the appropriate team.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Feature requests go to product. Bugs go to engineering.
                Complaints go to support.
              </strong>{" "}
              All automatically. All with the original review linked.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Questions? Reach out at{" "}
              <a
                href="mailto:info@donkeyideas.com"
                className="text-accent font-medium"
              >
                info@donkeyideas.com
              </a>
              .
            </p>
          </div>

          {/* Routing example */}
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
              SAMPLE · AUTO-ROUTED REVIEWS
            </div>
            {[
              {
                review: "\u201CApp crashes when I try to export...\u201D",
                type: "Bug report",
                destination: "Linear \u2192 Engineering",
                priority: "P1",
                color: "#ef4444",
              },
              {
                review: "\u201CWould love a dark mode option\u201D",
                type: "Feature request",
                destination: "Linear \u2192 Product",
                priority: "P3",
                color: "var(--color-accent)",
              },
              {
                review: "\u201CBeen charged twice this month\u201D",
                type: "Billing issue",
                destination: "Jira \u2192 Support",
                priority: "P1",
                color: "#ef4444",
              },
              {
                review: "\u201CSync doesn\u2019t work with Apple Watch\u201D",
                type: "Bug report",
                destination: "Linear \u2192 Engineering",
                priority: "P2",
                color: "#f59e0b",
              },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #2a2a28",
                }}
              >
                <div
                  className="mb-2"
                  style={{
                    fontSize: "14px",
                    color: "var(--color-paper-3)",
                    fontStyle: "italic",
                  }}
                >
                  {row.review}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: "#2a2a28",
                      color: "var(--color-paper-3)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {row.type}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      color: "var(--color-ink-4)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {row.destination}
                  </span>
                  <span
                    className="ml-auto font-mono font-bold"
                    style={{
                      fontSize: "10px",
                      color: row.color,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {row.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Predictive rating section */}
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
          {/* Rating forecast card */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid var(--color-line)",
              padding: "36px 32px",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "var(--color-ink-3)",
                marginBottom: "20px",
              }}
            >
              RATING FORECAST · NEXT 30 DAYS
            </div>
            <div className="mb-4 flex items-baseline gap-3">
              <span
                className="font-extrabold"
                style={{
                  fontSize: "64px",
                  letterSpacing: "-0.03em",
                  color: "var(--color-ink)",
                  lineHeight: 1,
                }}
              >
                4.6
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: "11px",
                  color: "var(--color-warn)",
                  letterSpacing: "0.08em",
                }}
              >
                AT RISK · -0.1 PROJECTED
              </span>
            </div>
            <div
              className="mb-4 text-ink-3"
              style={{ fontSize: "14px", lineHeight: "1.5" }}
            >
              Negative sentiment on &ldquo;sync issues&rdquo; cluster increasing.
              15 bug reports in the last 48h. If unaddressed, rating projected
              to drop to 4.5 within 30 days.
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                color: "var(--color-accent)",
                letterSpacing: "0.08em",
              }}
            >
              RECOMMENDED: PRIORITISE SYNC FIX IN NEXT SPRINT
            </div>
          </div>

          <div>
            <div className="sec-kicker">PREDICTIVE ANALYTICS</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Know the drop{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                before
              </em>{" "}
              it happens.
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Our predictive model analyses review velocity, sentiment trends,
              and historical patterns to forecast rating movements 30 days out.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Get alerted when your rating is at risk
              </strong>{" "}
              with specific recommendations on which issues to fix. Connect the
              forecast to your sprint planning and stay ahead of drops.
            </p>
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
          <div className="sec-kicker">MORE CAPABILITIES</div>
          <h2 className="sec-h2">
            Complete review <em>management</em>.
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
            Turn reviews into <em>action</em>.
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
            Predictive ratings, sentiment clustering, auto-routing. Included
            on all plans. 14-day free trial. No credit card.
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
