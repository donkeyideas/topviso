import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const entries = [
  {
    date: "April 21, 2026",
    tag: "PLATFORM",
    tagColor: "#6dd48e",
    title: "SOC 2 Type II compliance achieved",
    description:
      "Top Viso has completed its SOC 2 Type II audit with zero exceptions. Your data security and privacy remain our top priority. The full report is available to customers under NDA upon request.",
  },
  {
    date: "April 14, 2026",
    tag: "CREATIVE LAB",
    tagColor: "var(--color-accent)",
    title: "Synthetic user testing in beta",
    description:
      "You can now test screenshots, icons, and descriptions against synthetic user panels before going live. Early results show a 26% average CVR lift from the first round of testing. Available to all Growth and Enterprise plans.",
  },
  {
    date: "April 7, 2026",
    tag: "KEYWORDS",
    tagColor: "var(--color-accent)",
    title: "Semantic intent clustering now available",
    description:
      "Keywords are no longer just strings. Our new intent clustering engine groups keywords by user intent, surfacing the queries that actually drive installs. Works across App Store and Play Store with LLM cross-referencing.",
  },
  {
    date: "April 1, 2026",
    tag: "LLM TRACKER",
    tagColor: "var(--color-accent)",
    title: "Added Copilot and Perplexity Pro support",
    description:
      "LLM Tracker now polls five engines daily: ChatGPT, Claude, Gemini, Perplexity, and Microsoft Copilot. Track which prompts surface your app, which sources are cited, and how your visibility changes over time.",
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          padding: "80px 32px 64px",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
          textAlign: "center",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <div className="sec-kicker">CHANGELOG</div>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(36px, 6vw, 64px)",
              letterSpacing: "-0.035em",
              lineHeight: 1,
              marginBottom: "16px",
              color: "var(--color-ink)",
            }}
          >
            What&apos;s <em style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic", color: "var(--color-accent)" }}>new</em>.
          </h1>
          <p
            className="text-ink-2 mx-auto"
            style={{ fontSize: "19px", maxWidth: "480px", lineHeight: "1.45" }}
          >
            The latest features, improvements, and fixes shipped to the Top Viso
            platform.
          </p>
        </div>
      </section>

      {/* Changelog entries */}
      <section style={{ padding: "64px 32px 80px" }}>
        <div className="mx-auto" style={{ maxWidth: "740px" }}>
          {entries.map((entry, i) => (
            <div
              key={entry.title}
              style={{
                paddingBottom: "48px",
                marginBottom: "48px",
                borderBottom:
                  i < entries.length - 1
                    ? "1px solid var(--color-line)"
                    : "none",
              }}
            >
              {/* Date + tag */}
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="font-mono text-ink-3"
                  style={{ fontSize: "12px", letterSpacing: "0.08em" }}
                >
                  {entry.date}
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: entry.tagColor,
                    color:
                      entry.tagColor === "#6dd48e"
                        ? "var(--color-ink)"
                        : "#fff",
                  }}
                >
                  {entry.tag}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-ink mb-3 font-bold"
                style={{
                  fontSize: "24px",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {entry.title}
              </h3>

              {/* Description */}
              <p
                className="text-ink-3"
                style={{ fontSize: "15px", lineHeight: "1.6" }}
              >
                {entry.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Subscribe CTA */}
      <section
        className="border-t border-line"
        style={{ padding: "48px 32px", textAlign: "center" }}
      >
        <div className="mx-auto" style={{ maxWidth: "500px" }}>
          <p
            className="text-ink-3 mb-4"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Want to stay in the loop? Follow our changelog or reach out at{" "}
            <a
              href="mailto:info@donkeyideas.com"
              className="text-accent font-medium"
              style={{ textDecoration: "underline" }}
            >
              info@donkeyideas.com
            </a>
            .
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/signup" className="btn btn-accent">
              Start free trial &rarr;
            </a>
            <a
              href="https://calendar.app.google/QE2nZAujsJm88HUs6"
              className="btn btn-ghost"
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
