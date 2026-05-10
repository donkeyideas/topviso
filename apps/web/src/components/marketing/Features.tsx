export function Features() {
  return (
    <section className="mkt-section border-b border-line" style={{ padding: "100px 32px" }}>
      {/* Section header */}
      <div className="sec-head mx-auto mb-16 text-center" style={{ maxWidth: "900px" }}>
        <div className="sec-kicker">EVERYTHING YOU NEED</div>
        <h2 className="sec-h2">
          One tool. <em>Seven surfaces</em>.
          <br />
          Every metric that matters.
        </h2>
        <p
          className="mkt-text-lg mx-auto text-ink-3"
          style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
        >
          We built everything AppTweak and Sensor Tower offer, then added the
          stuff they can&apos;t: LLM tracking, conversion auditing, competitor
          intelligence, and real growth analytics.
        </p>
      </div>

      {/* Feature grid */}
      <div
        className="mkt-grid-3 mx-auto grid gap-5"
        style={{ maxWidth: "1280px", gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {/* Card 1: LLM Discovery (highlighted) */}
        <div className="feature-card feature-card-hl">
          <div className="feat-badge">FLAGSHIP</div>
          <div className="feature-icon feature-icon-hl">✦</div>
          <h3
            className="mb-3 font-bold leading-[1.15]"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            LLM Discovery
          </h3>
          <p
            className="mb-5 flex-1 text-paper-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Poll ChatGPT, Claude, Gemini, Perplexity, Copilot every day. Find the
            prompts you rank for, the ones you don&apos;t, and which sources the AIs
            cite.
          </p>
          <div className="feat-metric feat-metric-hl">5 engines</div>
          <div className="feat-metric-label feat-metric-label-hl">
            POLLED DAILY · 7 SURFACES
          </div>
        </div>

        {/* Card 2: Keywords + Intent */}
        <div className="feature-card">
          <div className="feature-icon">K</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Keywords + Intent
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Not just keyword ranks. Intent clusters that map your app to what users
            actually mean, not just what they type.
          </p>
          <div className="feat-metric">Semantic</div>
          <div className="feat-metric-label">INTENT CLUSTERING</div>
        </div>

        {/* Card 3: Optimizer */}
        <div className="feature-card">
          <div className="feature-icon">O</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Optimizer
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            AI-powered metadata optimization. Get title, subtitle, and description
            suggestions scored against your keyword targets and competitors.
          </p>
          <div className="feat-metric">AI</div>
          <div className="feat-metric-label">METADATA SCORING</div>
        </div>

        {/* Card 4: Competitors */}
        <div className="feature-card">
          <div className="feature-icon">V</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Competitors
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Auto-detect competitors by keyword overlap and category. Track their
            rankings, ratings, and store listing changes side-by-side.
          </p>
          <div className="feat-metric">Auto</div>
          <div className="feat-metric-label">COMPETITOR DETECTION</div>
        </div>

        {/* Card 5: Reviews+ */}
        <div className="feature-card">
          <div className="feature-icon">R</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Reviews+
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Sentiment analysis, topic clustering, and AI-generated reply suggestions.
            Spot trends before your rating drops.
          </p>
          <div className="feat-metric">AI</div>
          <div className="feat-metric-label">SENTIMENT ANALYSIS</div>
        </div>

        {/* Card 6: Creative Lab */}
        <div className="feature-card">
          <div className="feature-icon">C</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Creative Lab
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Analyze your screenshots, icon, and store visuals. Get design
            recommendations and competitive benchmarking for creatives.
          </p>
          <div className="feat-metric">Visual</div>
          <div className="feat-metric-label">CREATIVE ANALYSIS</div>
        </div>

        {/* Card 7: Conversion */}
        <div className="feature-card feature-card-hl">
          <div className="feat-badge">NEW</div>
          <div className="feature-icon feature-icon-hl">↗</div>
          <h3
            className="mb-3 font-bold leading-[1.15]"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Conversion
          </h3>
          <p
            className="mb-5 flex-1 text-paper-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Audit your search result card — icon, title, subtitle, rating,
            screenshots. Find exactly why users scroll past you.
          </p>
          <div className="feat-metric feat-metric-hl">Audit</div>
          <div className="feat-metric-label feat-metric-label-hl">
            IMPRESSION → INSTALL
          </div>
        </div>

        {/* Card 8: Growth */}
        <div className="feature-card">
          <div className="feature-icon">G</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Growth
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Growth opportunity analysis with market sizing, expansion strategies,
            and actionable playbooks tailored to your app category.
          </p>
          <div className="feat-metric">Strategy</div>
          <div className="feat-metric-label">GROWTH PLAYBOOKS</div>
        </div>

        {/* Card 9: Localization */}
        <div className="feature-card">
          <div className="feature-icon">L</div>
          <h3
            className="mb-3 font-bold leading-[1.15] text-ink"
            style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
          >
            Localization
          </h3>
          <p
            className="mb-5 flex-1 text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Market-by-market localization scoring and AI-powered translation
            recommendations for metadata across 40+ locales.
          </p>
          <div className="feat-metric">40+</div>
          <div className="feat-metric-label">LOCALES SUPPORTED</div>
        </div>
      </div>
    </section>
  );
}
