import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const systems = [
  { name: "API", description: "REST API and webhook delivery" },
  { name: "Web App", description: "Dashboard, reports, and settings" },
  { name: "LLM Tracker", description: "ChatGPT, Claude, Gemini, Perplexity, Copilot polling" },
  { name: "Workers", description: "Background jobs, data pipelines, and scheduled tasks" },
  { name: "Database", description: "Primary datastore and read replicas" },
];

export default function StatusPage() {
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
          <div className="sec-kicker">SYSTEM STATUS</div>

          {/* All operational badge */}
          <div
            className="mx-auto mb-6 inline-flex items-center gap-3"
            style={{
              padding: "12px 24px",
              background: "rgba(109, 212, 142, 0.12)",
              border: "1px solid #6dd48e",
              borderRadius: "999px",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#6dd48e",
                display: "inline-block",
                boxShadow: "0 0 8px rgba(109, 212, 142, 0.5)",
              }}
            />
            <span
              className="font-mono"
              style={{
                fontSize: "13px",
                letterSpacing: "0.1em",
                fontWeight: 600,
                color: "#3a8a52",
              }}
            >
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "clamp(36px, 6vw, 56px)",
              letterSpacing: "-0.035em",
              lineHeight: 1,
              marginBottom: "16px",
              color: "var(--color-ink)",
            }}
          >
            Status
          </h1>
          <p
            className="text-ink-3"
            style={{ fontSize: "15px", lineHeight: "1.5" }}
          >
            Real-time health of every Top Viso service. Updated continuously.
          </p>
        </div>
      </section>

      {/* Systems list */}
      <section style={{ padding: "64px 32px 80px" }}>
        <div className="mx-auto" style={{ maxWidth: "700px" }}>
          {systems.map((system, i) => (
            <div
              key={system.name}
              className="flex items-center justify-between"
              style={{
                padding: "20px 0",
                borderBottom:
                  i < systems.length - 1
                    ? "1px solid var(--color-line)"
                    : "none",
              }}
            >
              <div>
                <h3
                  className="text-ink font-bold"
                  style={{ fontSize: "16px", marginBottom: "2px" }}
                >
                  {system.name}
                </h3>
                <p
                  className="text-ink-3"
                  style={{ fontSize: "13px", lineHeight: "1.4" }}
                >
                  {system.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#6dd48e",
                    display: "inline-block",
                  }}
                />
                <span
                  className="font-mono"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    color: "#3a8a52",
                    fontWeight: 600,
                  }}
                >
                  Operational
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Uptime bar chart placeholder */}
      <section
        className="border-t border-line"
        style={{ padding: "48px 32px", textAlign: "center" }}
      >
        <div className="mx-auto" style={{ maxWidth: "700px" }}>
          <h3
            className="text-ink mb-2 font-bold"
            style={{ fontSize: "18px", letterSpacing: "-0.01em" }}
          >
            90-day uptime
          </h3>
          <p
            className="text-ink-3 mb-6"
            style={{ fontSize: "14px" }}
          >
            99.98% across all services
          </p>

          {/* Uptime visual bar */}
          <div
            className="mx-auto flex gap-[2px]"
            style={{ maxWidth: "600px", height: "32px" }}
          >
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: "#6dd48e",
                  borderRadius: "2px",
                  opacity: 0.85 + Math.random() * 0.15,
                }}
              />
            ))}
          </div>
          <div
            className="mx-auto mt-2 flex justify-between font-mono text-ink-3"
            style={{ maxWidth: "600px", fontSize: "10px", letterSpacing: "0.08em" }}
          >
            <span>90 DAYS AGO</span>
            <span>TODAY</span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        className="border-t border-line"
        style={{ padding: "48px 32px", textAlign: "center" }}
      >
        <p
          className="text-ink-3"
          style={{ fontSize: "14px", lineHeight: "1.5" }}
        >
          Experiencing issues? Contact us at{" "}
          <a
            href="mailto:info@donkeyideas.com"
            className="text-accent font-medium"
            style={{ textDecoration: "underline" }}
          >
            info@donkeyideas.com
          </a>
        </p>
      </section>

      <Footer />
    </>
  );
}
