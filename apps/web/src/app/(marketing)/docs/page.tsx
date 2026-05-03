import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const categories = [
  {
    icon: "G",
    title: "Getting Started",
    description:
      "Set up your account, connect your first app, and start tracking across all seven discovery surfaces in under ten minutes.",
    links: [
      "Quick-start guide",
      "Connecting your app",
      "Dashboard walkthrough",
      "Team invitations",
    ],
  },
  {
    icon: "A",
    title: "API Reference",
    description:
      "Full REST API documentation with authentication, endpoints, rate limits, and response schemas. Everything you need to build on top of Top Viso.",
    links: [
      "Authentication & keys",
      "Keyword endpoints",
      "LLM Tracker endpoints",
      "Webhooks",
    ],
  },
  {
    icon: "H",
    title: "Guides",
    description:
      "Step-by-step tutorials for advanced workflows: intent clustering, creative A/B testing, attribution modeling, and LLM optimization.",
    links: [
      "LLM optimization playbook",
      "Creative testing workflow",
      "Attribution setup",
      "Review routing rules",
    ],
  },
  {
    icon: "I",
    title: "Integrations",
    description:
      "Connect Top Viso to the tools you already use. Slack, Linear, Jira, Segment, BigQuery, and more. Real-time alerts and data syncs.",
    links: [
      "Slack notifications",
      "Linear / Jira routing",
      "BigQuery export",
      "Segment integration",
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <Nav />

      {/* Hero / Search section */}
      <section
        className="border-b border-line"
        style={{
          padding: "80px 32px 64px",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
          textAlign: "center",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <div className="sec-kicker">DOCUMENTATION</div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              marginBottom: "16px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Learn <em style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic", color: "var(--color-accent)" }}>everything</em> about Top Viso
          </h1>
          <p
            className="text-ink-3 mx-auto"
            style={{ fontSize: "19px", maxWidth: "560px", lineHeight: "1.45", marginBottom: "36px" }}
          >
            Guides, references, and tutorials to help you track, optimize, and grow across every discovery surface.
          </p>

          {/* Search placeholder */}
          <div
            className="mx-auto flex items-center gap-3"
            style={{
              maxWidth: "520px",
              background: "#fff",
              border: "1px solid var(--color-line)",
              borderRadius: "10px",
              padding: "14px 20px",
            }}
          >
            <span className="text-ink-3" style={{ fontSize: "18px" }}>
              &#x2315;
            </span>
            <span
              className="text-ink-3"
              style={{ fontSize: "15px", flex: 1, textAlign: "left" }}
            >
              Search documentation...
            </span>
            <span
              className="font-mono text-ink-3"
              style={{
                fontSize: "11px",
                border: "1px solid var(--color-line)",
                borderRadius: "4px",
                padding: "2px 8px",
                letterSpacing: "0.08em",
              }}
            >
              /
            </span>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section style={{ padding: "80px 32px" }}>
        <div
          className="mx-auto grid gap-6"
          style={{ maxWidth: "1280px", gridTemplateColumns: "repeat(2, 1fr)" }}
        >
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="feature-card"
              style={{ minHeight: "auto" }}
            >
              <div className="feature-icon">{cat.icon}</div>
              <h3
                className="mb-3 font-bold text-ink"
                style={{ fontSize: "24px", letterSpacing: "-0.02em" }}
              >
                {cat.title}
              </h3>
              <p
                className="mb-6 text-ink-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {cat.description}
              </p>
              <ul className="list-none" style={{ marginTop: "auto" }}>
                {cat.links.map((link) => (
                  <li
                    key={link}
                    className="text-ink-2"
                    style={{
                      padding: "6px 0",
                      borderTop: "1px solid var(--color-line)",
                      fontSize: "14px",
                    }}
                  >
                    <span
                      className="text-accent font-mono"
                      style={{ fontSize: "12px", marginRight: "8px" }}
                    >
                      &rarr;
                    </span>
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Help banner */}
      <section
        className="border-t border-line"
        style={{ padding: "60px 32px", textAlign: "center" }}
      >
        <div className="mx-auto" style={{ maxWidth: "600px" }}>
          <h3
            className="text-ink mb-3 font-bold"
            style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
          >
            Can&apos;t find what you need?
          </h3>
          <p
            className="text-ink-3 mb-6"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Our team is here to help. Reach out any time and we&apos;ll get back to
            you within a few hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:info@donkeyideas.com"
              className="btn btn-ink"
            >
              Email support
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
