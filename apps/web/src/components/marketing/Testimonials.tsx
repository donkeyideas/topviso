const useCases = [
  {
    quote: (
      <>
        Stop guessing which <em>LLM recommends</em> your competitor instead of
        you. See exactly where you rank across ChatGPT, Claude, and Gemini.
      </>
    ),
    initials: "LT",
    title: "LLM Tracker",
    role: "Track AI discovery surfaces",
    color: "#1d3fd9",
  },
  {
    quote: (
      <>
        Replace three tools with one. <em>Save thousands per month</em> and get
        LLM tracking that nobody else offers.
      </>
    ),
    initials: "KI",
    title: "Keywords + Intent",
    role: "Semantic keyword clustering",
    color: "#c43b1e",
  },
  {
    quote: (
      <>
        Pre-launch creative testing on synthetic users. Know your{" "}
        <em>CVR impact</em> before you ever push to the store.
      </>
    ),
    initials: "CL",
    title: "Creative Lab",
    role: "A/B test icons & screenshots",
    color: "#1f6a3a",
  },
  {
    quote: (
      <>
        Intent Map understands what users <em>actually</em> mean when they
        search — not just the keywords they type.
      </>
    ),
    initials: "IM",
    title: "Intent Map",
    role: "Map user search intent",
    color: "#b58300",
  },
  {
    quote: (
      <>
        Bayesian MMM with geo holdouts. Know your <em>real CAC</em>, not your
        attributed fantasy.
      </>
    ),
    initials: "AT",
    title: "Attribution",
    role: "Cross-surface measurement",
    color: "#0e0e0c",
  },
  {
    quote: (
      <>
        Auto-route every 1-star review to your on-call engineer.{" "}
        <em>Ship fixes before ratings drop.</em>
      </>
    ),
    initials: "R+",
    title: "Reviews+",
    role: "Sentiment analysis & routing",
    color: "#4a5cc4",
  },
];

export function Testimonials() {
  return (
    <section
      className="border-b border-line"
      style={{
        padding: "100px 32px",
        background: "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
      }}
    >
      {/* Section header */}
      <div className="mx-auto mb-16 text-center" style={{ maxWidth: "900px" }}>
        <div className="sec-kicker">BUILT FOR GROWTH TEAMS</div>
        <h2 className="sec-h2">
          Stop <em>guessing</em>. Start measuring.
        </h2>
        <p
          className="mx-auto text-ink-3"
          style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
        >
          From indie devs tracking a single launch to agencies managing portfolios
          of 200+ apps — Top Viso covers every use case.
        </p>
      </div>

      {/* Use case grid */}
      <div
        className="mx-auto grid gap-5"
        style={{ maxWidth: "1280px", gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {useCases.map((t) => (
          <div key={t.initials} className="testim-card">
            <div
              className="mb-[18px]"
              style={{
                color: "var(--color-accent)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              USE CASE
            </div>
            <p
              className="mb-6 flex-1 font-medium text-ink"
              style={{ fontSize: "18px", lineHeight: "1.45" }}
            >
              {t.quote}
            </p>
            <div
              className="flex items-center gap-3 border-t border-line-soft pt-[18px]"
            >
              <div className="testim-avatar" style={{ background: t.color }}>
                {t.initials}
              </div>
              <div>
                <strong className="block text-sm font-bold">{t.title}</strong>
                <small className="text-xs text-ink-3">{t.role}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
