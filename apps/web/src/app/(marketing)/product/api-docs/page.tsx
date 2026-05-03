import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const endpointGroups = [
  {
    group: "LLM Tracker",
    endpoints: [
      { method: "GET", path: "/v1/llm/rankings", desc: "Prompt rankings across all engines" },
      { method: "GET", path: "/v1/llm/citations", desc: "Source citations by engine" },
      { method: "GET", path: "/v1/llm/prompts", desc: "List tracked prompts" },
      { method: "POST", path: "/v1/llm/prompts", desc: "Add prompts to tracking" },
    ],
  },
  {
    group: "Keywords",
    endpoints: [
      { method: "GET", path: "/v1/keywords/ranks", desc: "Keyword rankings by store" },
      { method: "GET", path: "/v1/keywords/clusters", desc: "Intent clusters" },
      { method: "GET", path: "/v1/keywords/tags", desc: "Apple Tags data" },
      { method: "GET", path: "/v1/keywords/gaps", desc: "Keyword gap analysis" },
    ],
  },
  {
    group: "Creative Lab",
    endpoints: [
      { method: "GET", path: "/v1/creative/experiments", desc: "List experiments" },
      { method: "POST", path: "/v1/creative/experiments", desc: "Create experiment" },
      { method: "GET", path: "/v1/creative/results/{id}", desc: "Experiment results" },
    ],
  },
  {
    group: "Attribution",
    endpoints: [
      { method: "GET", path: "/v1/attribution/decomposition", desc: "Channel decomposition" },
      { method: "GET", path: "/v1/attribution/cac", desc: "CAC by channel" },
      { method: "GET", path: "/v1/attribution/holdouts", desc: "Geo holdout results" },
    ],
  },
  {
    group: "Reviews+",
    endpoints: [
      { method: "GET", path: "/v1/reviews", desc: "List reviews with sentiment" },
      { method: "GET", path: "/v1/reviews/clusters", desc: "Sentiment clusters" },
      { method: "POST", path: "/v1/reviews/{id}/reply", desc: "Reply to review" },
      { method: "GET", path: "/v1/reviews/forecast", desc: "Rating forecast" },
    ],
  },
  {
    group: "Store Intel",
    endpoints: [
      { method: "GET", path: "/v1/intel/competitors", desc: "Competitor list" },
      { method: "GET", path: "/v1/intel/changes", desc: "Metadata change feed" },
      { method: "GET", path: "/v1/intel/rankings", desc: "Category rankings" },
    ],
  },
];

const tiers = [
  { plan: "Solo", calls: "10K", rate: "100/min", webhooks: false },
  { plan: "Team", calls: "250K", rate: "500/min", webhooks: true },
  { plan: "Enterprise", calls: "Unlimited", rate: "Custom", webhooks: true },
];

const webhookEvents = [
  "ranking.changed",
  "llm.ranking.changed",
  "review.received",
  "review.sentiment.negative",
  "experiment.completed",
  "experiment.winner.detected",
  "rating.forecast.risk",
  "competitor.metadata.changed",
  "keyword.rank.dropped",
  "citation.new",
];

export default function ApiDocsPage() {
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
          <div className="sec-kicker">API DOCUMENTATION</div>
          <h2 className="sec-h2">
            Build on <em>Top Viso</em>.
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
            REST API access at every tier. Comprehensive endpoints for every
            module. Webhook triggers for real-time automation. From 10K to
            unlimited calls per month.
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
            <em>REST</em>
          </div>
          <div className="stat-l">JSON API</div>
        </div>
        <div className="stat">
          <div className="stat-n">250K</div>
          <div className="stat-l">CALLS/MO ON TEAM</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>10+</em>
          </div>
          <div className="stat-l">WEBHOOK EVENTS</div>
        </div>
        <div className="stat">
          <div className="stat-n">All</div>
          <div className="stat-l">TIERS INCLUDED</div>
        </div>
      </div>

      {/* API tier comparison */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">API ACCESS</div>
          <h2 className="sec-h2">
            Every plan. <em>Every endpoint</em>.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            We don&apos;t lock API access behind enterprise tiers. Every plan
            gets full API access \u2014 only the volume and rate limits change.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {tiers.map((tier, i) => (
            <div
              key={tier.plan}
              className={`feature-card${i === 1 ? " feature-card-hl" : ""}`}
              style={{ minHeight: "auto" }}
            >
              {i === 1 && <div className="feat-badge">POPULAR</div>}
              <h3
                className={`mb-1 font-bold leading-[1.15]${i === 1 ? "" : " text-ink"}`}
                style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
              >
                {tier.plan}
              </h3>
              <div
                className="font-mono"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  color: i === 1 ? "var(--color-ink-4)" : "var(--color-ink-3)",
                  marginBottom: "24px",
                }}
              >
                API TIER
              </div>
              <div className={`feat-metric${i === 1 ? " feat-metric-hl" : ""}`}>
                {tier.calls}
              </div>
              <div
                className={`feat-metric-label${i === 1 ? " feat-metric-label-hl" : ""}`}
                style={{ marginBottom: "16px" }}
              >
                CALLS PER MONTH
              </div>
              <ul className="list-none" style={{ marginTop: "16px" }}>
                <li
                  className="flex items-start gap-[10px]"
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: i === 1 ? "var(--color-paper-3)" : "var(--color-ink-2)",
                  }}
                >
                  <span
                    className="flex-shrink-0 font-extrabold"
                    style={{ color: i === 1 ? "#6dd48e" : "var(--color-accent)" }}
                  >
                    ✓
                  </span>
                  <span>Rate limit: {tier.rate}</span>
                </li>
                <li
                  className="flex items-start gap-[10px]"
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: i === 1 ? "var(--color-paper-3)" : "var(--color-ink-2)",
                  }}
                >
                  <span
                    className="flex-shrink-0 font-extrabold"
                    style={{ color: i === 1 ? "#6dd48e" : "var(--color-accent)" }}
                  >
                    ✓
                  </span>
                  <span>All endpoints included</span>
                </li>
                <li
                  className="flex items-start gap-[10px]"
                  style={{
                    padding: "8px 0",
                    fontSize: "14px",
                    color: i === 1 ? "var(--color-paper-3)" : "var(--color-ink-2)",
                  }}
                >
                  <span
                    className="flex-shrink-0 font-extrabold"
                    style={{
                      color: tier.webhooks
                        ? i === 1
                          ? "#6dd48e"
                          : "var(--color-accent)"
                        : "var(--color-ink-3)",
                    }}
                  >
                    {tier.webhooks ? "✓" : "\u2014"}
                  </span>
                  <span>Webhook triggers</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Endpoints reference */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">ENDPOINTS</div>
          <h2 className="sec-h2">
            Comprehensive <em>REST API</em>.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Every module exposes a full set of endpoints. JSON request and
            response bodies. Bearer token authentication. Versioned paths.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(2, 1fr)",
          }}
        >
          {endpointGroups.map((group) => (
            <div
              key={group.group}
              style={{
                background: "var(--color-ink)",
                borderRadius: "16px",
                padding: "32px 28px",
                color: "var(--color-paper)",
              }}
            >
              <div
                className="mb-4 font-mono"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  color: "var(--color-ink-4)",
                }}
              >
                {group.group.toUpperCase()}
              </div>
              {group.endpoints.map((ep, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #2a2a28",
                    fontSize: "13px",
                  }}
                >
                  <span
                    className="font-mono font-bold"
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background:
                        ep.method === "GET"
                          ? "rgba(109, 212, 142, 0.2)"
                          : "rgba(29, 63, 217, 0.3)",
                      color:
                        ep.method === "GET" ? "#6dd48e" : "var(--color-accent)",
                      letterSpacing: "0.08em",
                      width: "40px",
                      textAlign: "center",
                    }}
                  >
                    {ep.method}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "12px",
                      color: "var(--color-paper)",
                    }}
                  >
                    {ep.path}
                  </span>
                  <span
                    className="ml-auto"
                    style={{
                      fontSize: "12px",
                      color: "var(--color-ink-4)",
                    }}
                  >
                    {ep.desc}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Webhooks */}
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
            <div className="sec-kicker">WEBHOOKS</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Real-time{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                event triggers
              </em>
              .
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Subscribe to webhook events and get real-time HTTP POST
              notifications when things change. Ranking drops, new reviews,
              experiment completions \u2014 all pushed to your endpoint.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Build custom automations, pipe data to your warehouse, or
                trigger Slack alerts
              </strong>{" "}
              \u2014 all without polling our API.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Webhooks are available on Team and Enterprise plans. Questions?
              Email{" "}
              <a
                href="mailto:info@donkeyideas.com"
                className="text-accent font-medium"
              >
                info@donkeyideas.com
              </a>
              .
            </p>
          </div>

          {/* Webhook events */}
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
              AVAILABLE WEBHOOK EVENTS
            </div>
            {webhookEvents.map((event, i) => (
              <div
                key={i}
                className="flex items-center gap-3 font-mono"
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #2a2a28",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#6dd48e" }}>POST</span>
                <span style={{ color: "var(--color-paper)" }}>{event}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div className="mx-auto" style={{ maxWidth: "800px" }}>
          <div className="text-center">
            <div className="sec-kicker">GETTING STARTED</div>
            <h2 className="sec-h2">
              Simple <em>authentication</em>.
            </h2>
            <p
              className="mx-auto text-ink-3"
              style={{
                fontSize: "19px",
                maxWidth: "640px",
                lineHeight: "1.45",
                marginBottom: "40px",
              }}
            >
              Bearer token authentication. Generate API keys from your dashboard.
              All requests use HTTPS. All responses return JSON.
            </p>
          </div>

          {/* Code sample */}
          <div
            style={{
              background: "var(--color-ink)",
              borderRadius: "16px",
              padding: "32px 28px",
              color: "var(--color-paper)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              lineHeight: "1.7",
              overflow: "auto",
            }}
          >
            <div style={{ color: "var(--color-ink-4)" }}>
              # Fetch LLM rankings for your app
            </div>
            <div>
              <span style={{ color: "#6dd48e" }}>curl</span>{" "}
              <span style={{ color: "var(--color-paper-3)" }}>
                -H &quot;Authorization: Bearer YOUR_API_KEY&quot;
              </span>{" "}
              \
            </div>
            <div style={{ paddingLeft: "24px" }}>
              <span style={{ color: "var(--color-paper-3)" }}>
                -H &quot;Content-Type: application/json&quot;
              </span>{" "}
              \
            </div>
            <div style={{ paddingLeft: "24px" }}>
              <span style={{ color: "var(--color-accent)" }}>
                https://api.aso.dev/v1/llm/rankings?app_id=com.example.app
              </span>
            </div>
            <div style={{ marginTop: "16px", color: "var(--color-ink-4)" }}>
              # Response
            </div>
            <div style={{ color: "var(--color-paper-3)" }}>
              {`{`}
            </div>
            <div style={{ paddingLeft: "16px", color: "var(--color-paper-3)" }}>
              &quot;prompt&quot;: &quot;best budgeting app&quot;,
            </div>
            <div style={{ paddingLeft: "16px", color: "var(--color-paper-3)" }}>
              &quot;rankings&quot;: {`{`}
            </div>
            <div style={{ paddingLeft: "32px", color: "var(--color-paper-3)" }}>
              &quot;chatgpt&quot;: <span style={{ color: "#6dd48e" }}>1</span>,
            </div>
            <div style={{ paddingLeft: "32px", color: "var(--color-paper-3)" }}>
              &quot;claude&quot;: <span style={{ color: "#6dd48e" }}>2</span>,
            </div>
            <div style={{ paddingLeft: "32px", color: "var(--color-paper-3)" }}>
              &quot;gemini&quot;: <span style={{ color: "var(--color-warn)" }}>null</span>,
            </div>
            <div style={{ paddingLeft: "32px", color: "var(--color-paper-3)" }}>
              &quot;perplexity&quot;: <span style={{ color: "#6dd48e" }}>3</span>,
            </div>
            <div style={{ paddingLeft: "32px", color: "var(--color-paper-3)" }}>
              &quot;copilot&quot;: <span style={{ color: "#6dd48e" }}>1</span>
            </div>
            <div style={{ paddingLeft: "16px", color: "var(--color-paper-3)" }}>
              {`}`}
            </div>
            <div style={{ color: "var(--color-paper-3)" }}>
              {`}`}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
          <h2 className="final-cta-h2">
            Build with the <em>Top Viso API</em>.
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
            REST API access on every plan. Webhook triggers on Team and above.
            14-day free trial. No credit card required.
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
