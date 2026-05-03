const legacyItems = [
  "Track App Store + Play Store — that's it",
  "Zero visibility into ChatGPT, Claude, Gemini",
  "Keyword-only (no intent or semantic clustering)",
  "No incrementality measurement / MMM",
  "Last-touch attribution only",
  "No agent-readiness scoring",
  "API locked to enterprise tier",
  "Starts at $89/mo, scales to $1,500+",
];

const asoItems = [
  { text: "All ", bold: "7 discovery surfaces", after: ", one dashboard" },
  { text: "", bold: "LLM tracking", after: " across ChatGPT, Claude, Gemini, Perplexity, Copilot" },
  { text: "", bold: "Intent clustering", after: " for Apple Tags + semantic search" },
  { text: "Real ", bold: "Bayesian MMM", after: " with geo holdouts" },
  { text: "", bold: "Cross-surface attribution", after: " including LLM referrals" },
  { text: "", bold: "Agent-readiness", after: " scoring + manifests" },
  { text: "API access ", bold: "at every tier", after: "" },
  { text: "", bold: "Free to start", after: ", Team at $49/mo" },
];

export function Comparison() {
  return (
    <section className="border-b border-line" style={{ padding: "100px 32px" }}>
      {/* Section header */}
      <div className="mx-auto mb-16 text-center" style={{ maxWidth: "900px" }}>
        <div className="sec-kicker">HEAD TO HEAD</div>
        <h2 className="sec-h2">
          Why teams are <em>switching</em> from legacy tools.
        </h2>
        <p
          className="mx-auto text-ink-3"
          style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
        >
          We respect what AppTweak and Sensor Tower built. But the world changed,
          and they haven&apos;t.
        </p>
      </div>

      {/* VS Grid */}
      <div
        className="mx-auto grid gap-6"
        style={{ maxWidth: "1100px", gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Legacy card */}
        <div className="vs-card vs-card-them">
          <h3
            className="mb-2 font-bold"
            style={{ fontSize: "28px", letterSpacing: "-0.02em" }}
          >
            Legacy ASO tools
          </h3>
          <div className="vs-sub">APPTWEAK · SENSOR TOWER · APPFOLLOW</div>
          <ul className="list-none">
            {legacyItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-b border-line-soft text-ink-3"
                style={{ padding: "12px 0", fontSize: "15px" }}
              >
                <span
                  className="flex-shrink-0 text-sm font-bold"
                  style={{ color: "var(--color-warn)" }}
                >
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Top Viso card */}
        <div className="vs-card vs-card-us">
          <div className="vs-winner-badge">WINNER</div>
          <h3
            className="mb-2 font-bold"
            style={{ fontSize: "28px", letterSpacing: "-0.02em" }}
          >
            <em
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--color-accent)",
              }}
            >
              Top Viso
            </em>
          </h3>
          <div className="vs-sub" style={{ color: "var(--color-ink-4)" }}>
            ONE TOOL · 7 SURFACES · 10 MODULES
          </div>
          <ul className="list-none">
            {asoItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3"
                style={{
                  padding: "12px 0",
                  fontSize: "15px",
                  borderBottom: "1px solid #2a2a28",
                  color: "var(--color-paper-3)",
                }}
              >
                <span
                  className="flex-shrink-0 font-extrabold"
                  style={{ color: "#6dd48e", fontSize: "16px" }}
                >
                  ✓
                </span>
                <span>
                  {item.text}
                  <strong style={{ color: "var(--color-paper)" }}>
                    {item.bold}
                  </strong>
                  {item.after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
