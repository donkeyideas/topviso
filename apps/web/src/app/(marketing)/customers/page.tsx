import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const segments = [
  {
    title: "Indie developers",
    icon: "I",
    description:
      "You built the app. Now make sure people can actually find it. Top Viso gives you the same visibility data that billion-dollar teams have — across all 7 surfaces — without the enterprise price tag.",
    features: [
      "Track your app across App Store, Play Store, and 5 LLMs",
      "See which AI prompts surface your competitors but not you",
      "Optimize keywords with semantic intent clustering",
      "Free tier available — start without a credit card",
    ],
  },
  {
    title: "Growth teams",
    icon: "G",
    highlight: true,
    description:
      "Your install numbers do not tell the full story. 40% of users now ask AI before they ever open a store. Top Viso gives your growth team the missing half of the funnel.",
    features: [
      "Daily LLM polling across ChatGPT, Claude, Gemini, Perplexity, Copilot",
      "Bayesian MMM attribution — know your real CAC",
      "Creative Lab for pre-launch A/B testing",
      "Team dashboards with shared keyword lists and alerts",
    ],
  },
  {
    title: "Agencies",
    icon: "A",
    description:
      "Manage dozens of apps across multiple clients. Top Viso gives you multi-app dashboards, white-label reporting, and the only LLM tracker on the market — so you can offer what no other agency can.",
    features: [
      "Multi-app, multi-client workspace",
      "White-label PDF and live reports",
      "LLM Tracker as a differentiator for your pitch deck",
      "Bulk keyword and creative management",
    ],
  },
  {
    title: "Enterprise",
    icon: "E",
    description:
      "When your app portfolio spans markets, languages, and platforms, you need infrastructure — not spreadsheets. Top Viso gives enterprise teams unified visibility with the controls they require.",
    features: [
      "SSO, SCIM, and role-based access",
      "SOC 2, GDPR, and CCPA compliant",
      "Custom SLAs and dedicated support",
      "API-first — integrate with your existing data stack",
    ],
  },
];

export default function CustomersPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          padding: "100px 32px 80px",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(29,63,217,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="relative mx-auto"
          style={{ maxWidth: "900px", textAlign: "center" }}
        >
          <div className="sec-kicker">CUSTOMERS</div>
          <h1 className="sec-h2" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            Built for teams of{" "}
            <em>every size</em>.
          </h1>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "660px",
              lineHeight: "1.5",
              marginTop: "20px",
            }}
          >
            From solo developers shipping their first app to enterprise teams
            managing global portfolios &mdash; Top Viso scales to the way you work.
          </p>
        </div>
      </section>

      {/* Segments */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
          <div className="flex flex-col gap-8">
            {segments.map((segment) => (
              <div
                key={segment.title}
                className={
                  segment.highlight
                    ? "feature-card feature-card-hl"
                    : "feature-card"
                }
                style={{
                  minHeight: "auto",
                  flexDirection: "row",
                  gap: "48px",
                  padding: "48px 44px",
                }}
              >
                <div style={{ flex: "1 1 0" }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={
                        segment.highlight
                          ? "feature-icon feature-icon-hl"
                          : "feature-icon"
                      }
                    >
                      {segment.icon}
                    </div>
                    <h3
                      className={
                        segment.highlight
                          ? "font-bold"
                          : "font-bold text-ink"
                      }
                      style={{ fontSize: "28px", letterSpacing: "-0.02em" }}
                    >
                      {segment.title}
                    </h3>
                  </div>
                  <p
                    className={segment.highlight ? "text-paper-3" : "text-ink-3"}
                    style={{ fontSize: "16px", lineHeight: "1.6" }}
                  >
                    {segment.description}
                  </p>
                </div>
                <div style={{ flex: "1 1 0" }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {segment.features.map((feature) => (
                      <li
                        key={feature}
                        className={
                          segment.highlight ? "text-paper-3" : "text-ink-2"
                        }
                        style={{
                          fontSize: "15px",
                          lineHeight: "1.5",
                          padding: "8px 0",
                          borderBottom: segment.highlight
                            ? "1px solid #2a2a28"
                            : "1px solid var(--color-line)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <span
                          className="text-accent"
                          style={{
                            fontWeight: 700,
                            flexShrink: 0,
                            fontSize: "14px",
                            lineHeight: "1.55",
                          }}
                        >
                          +
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-n">
            7<em>+</em>
          </div>
          <div className="stat-l">DISCOVERY SURFACES</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            5<em>x</em>
          </div>
          <div className="stat-l">LLM ENGINES POLLED DAILY</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>&lt;</em>2
          </div>
          <div className="stat-l">MINUTES TO ONBOARD</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            0<em>$</em>
          </div>
          <div className="stat-l">TO START &middot; NO CARD</div>
        </div>
      </div>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "900px" }}>
          <h2
            className="final-cta-h2"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Ready to see the <em>full picture</em>?
          </h2>
          <p
            className="mx-auto mb-10"
            style={{
              fontSize: "20px",
              color: "var(--color-paper-3)",
              maxWidth: "620px",
              lineHeight: "1.45",
            }}
          >
            14-day free trial. No credit card required. Full access to all 7
            surfaces.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a href="/signup" className="btn btn-accent btn-xl">
              Start free trial &rarr;
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
        </div>
      </section>

      <Footer />
    </>
  );
}
