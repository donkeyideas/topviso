import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const capabilities = [
  {
    title: "Semantic intent clustering",
    description:
      "We group keywords by what users actually mean, not just string similarity. \u201CCalorie counter,\u201D \u201Cfood tracker,\u201D and \u201Cdiet app\u201D all map to the same intent cluster \u2014 and you see all of them in one view.",
  },
  {
    title: "Apple Tags integration",
    description:
      "We ingest Apple\u2019s official search tag data and cross-reference it with your keyword strategy. See which tags Apple assigns to your competitors and which ones you\u2019re missing.",
  },
  {
    title: "Dual-store rank tracking",
    description:
      "Track keyword rankings across both App Store and Play Store simultaneously. See where your positions diverge and optimise each store independently.",
  },
  {
    title: "Keyword gap analysis",
    description:
      "Identify the keywords your competitors rank for that you don\u2019t. Prioritise by volume, difficulty, and intent relevance \u2014 not just raw search volume.",
  },
  {
    title: "Intent-to-prompt mapping",
    description:
      "Connect traditional keyword clusters to the LLM prompts users ask. See how \u201Cbest running app\u201D in the store relates to \u201CWhat\u2019s the best app for tracking my runs?\u201D in ChatGPT.",
  },
  {
    title: "Historical trends",
    description:
      "Track keyword rank movements over time with daily granularity. Correlate ranking changes with metadata updates, creative tests, or market events.",
  },
];

const clusterExample = [
  { intent: "Budget tracking", keywords: ["budget app", "expense tracker", "money manager", "spending tracker"], volume: "14.2K" },
  { intent: "Savings goals", keywords: ["savings app", "save money app", "goal tracker finance"], volume: "8.7K" },
  { intent: "Bill management", keywords: ["bill reminder", "bill pay app", "bill tracker"], volume: "6.3K" },
  { intent: "Investment tracking", keywords: ["portfolio tracker", "stock app", "investment app"], volume: "11.1K" },
];

export default function KeywordsPage() {
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
          <div className="sec-kicker">KEYWORDS + INTENT</div>
          <h2 className="sec-h2">
            Rank for <em>meaning</em>,<br />
            not just strings.
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
            Traditional keyword tools show you positions. Top Viso shows you intent
            clusters \u2014 the semantic groups that map your app to what users
            actually mean, across App Store, Play Store, and LLMs.
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
            <em>2</em>
          </div>
          <div className="stat-l">STORES TRACKED</div>
        </div>
        <div className="stat">
          <div className="stat-n">Semantic</div>
          <div className="stat-l">INTENT CLUSTERING</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>&infin;</em>
          </div>
          <div className="stat-l">KEYWORDS ON TEAM+</div>
        </div>
        <div className="stat">
          <div className="stat-n">Daily</div>
          <div className="stat-l">RANK UPDATES</div>
        </div>
      </div>

      {/* Intent clusters demo */}
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
            <div className="sec-kicker">INTENT CLUSTERS</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              See what users{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                actually mean
              </em>
              .
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Instead of managing 500 individual keywords, Top Viso groups them into
              intent clusters. Each cluster represents a distinct user need \u2014
              and your ranking within it.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Optimise for intents, not keywords.
              </strong>{" "}
              When you improve your position in a cluster, you move up for every
              keyword in it.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Clusters automatically connect to LLM prompt data from LLM
              Tracker, so you can see the full discovery funnel.
            </p>
          </div>

          {/* Cluster example */}
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
              SAMPLE · INTENT CLUSTERS
            </div>
            {clusterExample.map((cluster, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid #2a2a28",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className="font-bold"
                    style={{ fontSize: "15px", color: "var(--color-paper)" }}
                  >
                    {cluster.intent}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: "#6dd48e",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {cluster.volume}/mo
                  </span>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  style={{ marginTop: "6px" }}
                >
                  {cluster.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="font-mono"
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#2a2a28",
                        color: "var(--color-paper-3)",
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
            Keywords, <em>reimagined</em>.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Everything legacy tools offer, plus semantic understanding that
            connects store keywords to LLM prompts.
          </p>
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

      {/* Apple Tags section */}
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
              APPLE TAGS · YOUR APP
            </div>
            {[
              { tag: "Finance", status: "Active", match: true },
              { tag: "Budget", status: "Active", match: true },
              { tag: "Money Management", status: "Active", match: true },
              { tag: "Savings", status: "Missing", match: false },
              { tag: "Personal Finance", status: "Missing", match: false },
              { tag: "Bill Tracker", status: "Competitor only", match: false },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-line)",
                  fontSize: "14px",
                }}
              >
                <span className="text-ink font-medium">{row.tag}</span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    color: row.match
                      ? "#6dd48e"
                      : "var(--color-warn)",
                  }}
                >
                  {row.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div className="sec-kicker">APPLE TAGS</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Apple&apos;s own{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                classification
              </em>
              , decoded.
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Apple assigns search tags to every app. These tags influence
              search ranking in ways keywords alone don&apos;t capture.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Top Viso surfaces which tags you have, which you&apos;re missing, and
                which your competitors have that you don&apos;t.
              </strong>
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
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
          <h2 className="final-cta-h2">
            Rank for <em>intent</em>,<br />
            not just keywords.
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
            Semantic intent clustering, Apple Tags, and dual-store tracking.
            14-day free trial. No credit card.
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
