import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const modules = [
  {
    icon: "✦",
    name: "LLM Tracker",
    badge: "FLAGSHIP",
    href: "/product/llm-tracker",
    highlight: true,
    description:
      "Poll ChatGPT, Claude, Gemini, Perplexity, and Copilot every day. See which prompts surface your app, which sources AIs cite, and where you rank across 5 LLM engines and 7 surfaces.",
    metric: "5 engines",
    metricLabel: "POLLED DAILY",
  },
  {
    icon: "K",
    name: "Keywords + Intent",
    href: "/product/keywords",
    highlight: false,
    description:
      "Semantic intent clustering, Apple Tags integration, and keyword ranks across App Store and Play Store. Map what users actually mean, not just what they type.",
    metric: "Semantic",
    metricLabel: "INTENT CLUSTERING",
  },
  {
    icon: "C",
    name: "Creative Lab",
    href: "/product/creative-lab",
    highlight: false,
    description:
      "Pre-launch testing on synthetic users, native store A/B experiments, and auto-rollout of winning variants. Icons, screenshots, descriptions — tested before they go live.",
    metric: "Pre-launch",
    metricLabel: "A/B TESTING",
  },
  {
    icon: "A",
    name: "Attribution",
    href: "/product/attribution",
    highlight: false,
    description:
      "Bayesian MMM + geo holdouts + LLM referral tracking. Cross-surface attribution that includes AI-driven installs. Know your real CAC, not your attributed fantasy.",
    metric: "MMM",
    metricLabel: "BAYESIAN ATTRIBUTION",
  },
  {
    icon: "R",
    name: "Reviews+",
    href: "/product/reviews-plus",
    highlight: false,
    description:
      "Predictive rating risk, sentiment clustering, and auto-routing to Linear or Jira. Ship fixes before your ratings drop. Respond to reviews at scale.",
    metric: "Auto",
    metricLabel: "SENTIMENT ROUTING",
  },
  {
    icon: "⧉",
    name: "Agent Ready",
    badge: "BETA",
    href: "/product",
    highlight: true,
    description:
      "When ChatGPT starts installing apps for users, you want to be on the shortlist. Score your agent readiness, get the manifest, and prepare for the agentic future.",
    metric: "Score",
    metricLabel: "AGENT READINESS INDEX",
  },
  {
    icon: "◈",
    name: "Intent Map",
    href: "/product",
    highlight: false,
    description:
      "Visualise the full discovery graph for your category. See how user intent flows from search queries to LLM prompts to store listings — and where you intercept it.",
    metric: "Graph",
    metricLabel: "DISCOVERY MAPPING",
  },
  {
    icon: "S",
    name: "Store Intel",
    href: "/product",
    highlight: false,
    description:
      "Competitive intelligence across both stores. Track competitor metadata changes, ranking movements, review velocity, and creative updates in real time.",
    metric: "Real-time",
    metricLabel: "COMPETITIVE INTEL",
  },
];

export default function ProductPage() {
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
          <div className="sec-kicker">THE PLATFORM</div>
          <h2 className="sec-h2">
            Eight modules. <em>One dashboard</em>.
            <br />
            Every surface covered.
          </h2>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "700px",
              lineHeight: "1.45",
              marginBottom: "40px",
            }}
          >
            Top Viso is the first platform that unifies App Store optimisation, LLM
            visibility tracking, creative testing, and attribution into a single
            tool. Here&apos;s everything inside.
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
          <div className="stat-n">8</div>
          <div className="stat-l">BUILT-IN MODULES</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>7</em>
          </div>
          <div className="stat-l">DISCOVERY SURFACES</div>
        </div>
        <div className="stat">
          <div className="stat-n">5</div>
          <div className="stat-l">LLM ENGINES</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>1</em>
          </div>
          <div className="stat-l">UNIFIED DASHBOARD</div>
        </div>
      </div>

      {/* Module grid */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">ALL MODULES</div>
          <h2 className="sec-h2">
            Everything you need to <em>dominate</em> discovery.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Each module works standalone, but the magic is in the connections.
            LLM data feeds Attribution. Reviews feed Intent. Creative Lab uses
            everything.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1280px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {modules.map((mod) => (
            <a
              key={mod.name}
              href={mod.href}
              className={`feature-card${mod.highlight ? " feature-card-hl" : ""}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {mod.badge && <div className="feat-badge">{mod.badge}</div>}
              <div
                className={`feature-icon${mod.highlight ? " feature-icon-hl" : ""}`}
              >
                {mod.icon}
              </div>
              <h3
                className={`mb-3 font-bold leading-[1.15]${mod.highlight ? "" : " text-ink"}`}
                style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
              >
                {mod.name}
              </h3>
              <p
                className={`mb-5 flex-1${mod.highlight ? " text-paper-3" : " text-ink-3"}`}
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {mod.description}
              </p>
              <div
                className={`feat-metric${mod.highlight ? " feat-metric-hl" : ""}`}
              >
                {mod.metric}
              </div>
              <div
                className={`feat-metric-label${mod.highlight ? " feat-metric-label-hl" : ""}`}
              >
                {mod.metricLabel}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* How it connects */}
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
            <div className="sec-kicker">CONNECTED BY DESIGN</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Modules that{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                talk to each other
              </em>
              .
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Your LLM Tracker data automatically feeds your Attribution model.
              Review sentiment updates your Intent Map. Creative Lab pulls
              keyword data to generate test hypotheses.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                No CSV exports. No manual syncing. No separate logins.
              </strong>{" "}
              Every module shares a single data layer, so insights compound
              instead of siloing.
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
          <div
            style={{
              background: "var(--color-ink)",
              borderRadius: "16px",
              padding: "48px 36px",
              color: "var(--color-paper)",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "var(--color-ink-4)",
                marginBottom: "24px",
              }}
            >
              DATA FLOW
            </div>
            {[
              { from: "LLM Tracker", to: "Attribution", desc: "AI referral signals" },
              { from: "Keywords", to: "Creative Lab", desc: "Top intent clusters" },
              { from: "Reviews+", to: "Intent Map", desc: "Sentiment signals" },
              { from: "Store Intel", to: "Keywords", desc: "Competitor gaps" },
              { from: "Attribution", to: "Creative Lab", desc: "CAC per variant" },
              { from: "Agent Ready", to: "LLM Tracker", desc: "Manifest coverage" },
            ].map((flow, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #2a2a28",
                  fontSize: "14px",
                }}
              >
                <span
                  style={{ color: "var(--color-accent)", fontWeight: 600 }}
                >
                  {flow.from}
                </span>
                <span style={{ color: "var(--color-ink-4)" }}>→</span>
                <span style={{ color: "var(--color-paper)" }}>
                  {flow.to}
                </span>
                <span
                  className="ml-auto font-mono"
                  style={{
                    fontSize: "11px",
                    color: "var(--color-ink-4)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {flow.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
          <h2 className="final-cta-h2">
            See the full <em>platform</em>
            <br />
            in action.
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
            14-day free trial. No credit card. Full access to all 8 modules
            across 7 surfaces. Start in under two minutes.
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
