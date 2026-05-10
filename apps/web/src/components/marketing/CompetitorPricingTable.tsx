const competitors = [
  { name: "Top Viso", highlight: true },
  { name: "AppTweak" },
  { name: "Sensor Tower" },
  { name: "data.ai" },
];

const rows: { feature: string; values: string[] }[] = [
  {
    feature: "Starting price",
    values: ["Free", "$89/mo", "$449/mo", "Custom (~$500+/mo)"],
  },
  {
    feature: "LLM tracking (ChatGPT, Claude, Gemini)",
    values: ["5 engines", "—", "—", "—"],
  },
  {
    feature: "App Store + Play Store",
    values: ["Yes", "Yes", "Yes", "Yes"],
  },
  {
    feature: "Semantic intent clustering",
    values: ["Yes", "—", "—", "—"],
  },
  {
    feature: "Bayesian MMM attribution",
    values: ["Yes", "—", "—", "—"],
  },
  {
    feature: "Creative A/B testing",
    values: ["Yes", "—", "Yes", "—"],
  },
  {
    feature: "Review sentiment + routing",
    values: ["Yes", "Yes", "—", "—"],
  },
  {
    feature: "Agent-readiness scoring",
    values: ["Yes", "—", "—", "—"],
  },
  {
    feature: "API access",
    values: ["All plans", "Enterprise only", "Enterprise only", "Enterprise only"],
  },
  {
    feature: "Keywords included",
    values: ["50–5,000", "15–unlimited", "Custom", "Custom"],
  },
  {
    feature: "All modules included",
    values: ["Yes, every plan", "Tiered", "Tiered", "Tiered"],
  },
];

export function CompetitorPricingTable() {
  return (
    <section className="mkt-section border-b border-line" style={{ padding: "100px 32px" }}>
      {/* Header */}
      <div className="mx-auto mb-16 text-center" style={{ maxWidth: "900px" }}>
        <div className="sec-kicker">FEATURE &amp; PRICING COMPARISON</div>
        <h2 className="sec-h2">
          See exactly what you <em>get</em>.
        </h2>
        <p
          className="mkt-text-lg mx-auto text-ink-3"
          style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
        >
          Feature-by-feature. No asterisks, no &ldquo;contact sales&rdquo; walls.
          Top Viso gives you more for less.
        </p>
      </div>

      {/* Table */}
      <div
        className="mx-auto"
        style={{ maxWidth: "1100px", overflowX: "auto" }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            minWidth: "700px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  color: "var(--color-ink-3)",
                  borderBottom: "2px solid var(--color-line)",
                }}
              >
                FEATURE
              </th>
              {competitors.map((c) => (
                <th
                  key={c.name}
                  style={{
                    textAlign: "center",
                    padding: "14px 12px",
                    fontWeight: c.highlight ? 800 : 600,
                    fontSize: c.highlight ? "15px" : "13px",
                    letterSpacing: "-0.01em",
                    color: c.highlight ? "var(--color-accent)" : "var(--color-ink)",
                    borderBottom: "2px solid var(--color-line)",
                    background: c.highlight
                      ? "var(--color-accent-wash)"
                      : "transparent",
                  }}
                >
                  {c.highlight ? (
                    <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: "18px" }}>
                      Top Viso
                    </span>
                  ) : (
                    c.name
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={row.feature}
                style={{
                  background: ri % 2 === 0 ? "var(--color-card-2)" : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "13px 16px",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                    borderBottom: "1px solid var(--color-line-soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.feature}
                </td>
                {row.values.map((val, vi) => {
                  const isUs = vi === 0;
                  const isYes = val === "Yes" || val.includes("engine") || val === "All plans" || val === "Yes, every plan";
                  const isNo = val === "—";

                  return (
                    <td
                      key={`${row.feature}-${vi}`}
                      style={{
                        textAlign: "center",
                        padding: "13px 12px",
                        borderBottom: "1px solid var(--color-line-soft)",
                        fontWeight: isUs ? 700 : 400,
                        color: isNo
                          ? "var(--color-ink-4)"
                          : isUs && isYes
                            ? "var(--color-ok)"
                            : "var(--color-ink-2)",
                        background: isUs ? "var(--color-accent-wash)" : "transparent",
                        fontFamily: ri === 0 ? "var(--font-sans)" : "inherit",
                        fontSize: ri === 0 && isUs ? "16px" : "inherit",
                      }}
                    >
                      {isNo ? "✕" : isYes && !val.includes("engine") && val !== "All plans" && val !== "Yes, every plan" ? "✓" : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto mt-12 text-center">
        <a
          href="/signup"
          className="btn btn-accent"
          style={{ fontSize: "15px", padding: "14px 32px" }}
        >
          Start free — no credit card →
        </a>
        <p
          className="mt-4 text-ink-3"
          style={{ fontSize: "13px" }}
        >
          Switch plans or cancel anytime. All features included on every tier.
        </p>
      </div>
    </section>
  );
}
