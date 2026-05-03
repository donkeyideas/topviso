import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const surfaces = [
  { name: "App Store", icon: "A" },
  { name: "Play Store", icon: "P" },
  { name: "ChatGPT", icon: "G" },
  { name: "Claude", icon: "C" },
  { name: "Gemini", icon: "G" },
  { name: "Perplexity", icon: "P" },
  { name: "Copilot", icon: "C" },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          padding: "100px 32px 80px",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(29,63,217,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="relative mx-auto"
          style={{ maxWidth: "900px", textAlign: "center" }}
        >
          <div className="sec-kicker">ABOUT TOP VISO</div>
          <h1 className="sec-h2" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            Every app deserves to be{" "}
            <em>discovered</em>.
          </h1>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "680px",
              lineHeight: "1.5",
              marginTop: "20px",
            }}
          >
            Not just on app stores, but across every surface users search.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto grid items-start gap-16"
          style={{ maxWidth: "1200px", gridTemplateColumns: "1fr 1fr" }}
        >
          <div>
            <h4
              className="mb-4 font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Our mission
            </h4>
            <h2
              className="font-display text-ink"
              style={{
                fontSize: "38px",
                lineHeight: "1.15",
                letterSpacing: "-0.02em",
              }}
            >
              We believe every app deserves to be discovered &mdash; not just on
              app stores, but across every surface users search.
            </h2>
          </div>
          <div>
            <p
              className="mb-6 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              <strong className="text-ink">
                40% of users now ask AI before opening a store.
              </strong>{" "}
              They ask ChatGPT for the best budgeting app. They ask Claude which
              meditation app has the best onboarding. They ask Perplexity to
              compare fitness trackers. The app store listing is no longer the
              first impression &mdash; it might be the last.
            </p>
            <p
              className="mb-6 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              Traditional ASO tools were built for a world where search meant
              keywords and rankings meant positions on a list. That world still
              exists, but it is no longer the whole picture.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              We founded Top Viso to solve the gap between traditional ASO tools and
              the new reality of LLM-driven discovery. We track all seven
              surfaces where your app gets found, measure what matters across
              every one of them, and give you the data to win in all of them.
            </p>
          </div>
        </div>
      </section>

      {/* 7 Surfaces */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
          <div className="mb-14 text-center">
            <div className="sec-kicker">THE FULL MAP</div>
            <h2 className="sec-h2">
              <em>Seven</em> surfaces. One tool.
            </h2>
            <p
              className="mx-auto text-ink-3"
              style={{ fontSize: "18px", maxWidth: "600px", lineHeight: "1.45" }}
            >
              We track every place users search for apps &mdash; from the
              traditional stores to the new wave of AI-driven discovery.
            </p>
          </div>

          <div
            className="mx-auto grid gap-5"
            style={{
              maxWidth: "1000px",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {surfaces.map((surface) => (
              <div
                key={surface.name}
                className="flex flex-col items-center rounded-2xl border border-line bg-white"
                style={{ padding: "36px 24px", textAlign: "center" }}
              >
                <div
                  className="mb-4 flex items-center justify-center rounded-xl font-display text-accent"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "var(--color-accent-wash)",
                    fontSize: "22px",
                    fontStyle: "italic",
                  }}
                >
                  {surface.icon}
                </div>
                <div
                  className="font-bold text-ink"
                  style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
                >
                  {surface.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why now */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto grid items-center gap-16"
          style={{ maxWidth: "1200px", gridTemplateColumns: "1fr 1fr" }}
        >
          <div
            className="problem-stat-card"
            style={{ textAlign: "center" }}
          >
            <span className="problem-pct">
              40<em>%</em>
            </span>
            <p
              className="font-mono uppercase"
              style={{
                fontSize: "12px",
                letterSpacing: "0.12em",
                color: "var(--color-ink-4)",
              }}
            >
              OF USERS ASK AI BEFORE OPENING A STORE
            </p>
          </div>
          <div>
            <h4
              className="mb-4 font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Why now
            </h4>
            <h2
              className="mb-6 font-bold text-ink"
              style={{
                fontSize: "36px",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              The ground shifted.
              <br />
              Your tools didn&apos;t.
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              LLMs are the new front page. Users ask ChatGPT, Claude, Gemini,
              Perplexity, and Copilot to recommend apps before they ever type a
              keyword in a store. If you are not tracking those surfaces, you are
              flying blind on 40% of your discovery funnel.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              We built Top Viso to be the single source of truth for every surface
              that matters &mdash; traditional and AI-native.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "900px" }}>
          <h2 className="final-cta-h2" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            Let&apos;s talk about <em>discovery</em>.
          </h2>
          <p
            className="mx-auto mb-10"
            style={{
              fontSize: "20px",
              color: "var(--color-paper-3)",
              maxWidth: "600px",
              lineHeight: "1.45",
            }}
          >
            Whether you have a question, want a demo, or just want to say hello
            &mdash; we would love to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a
              href="mailto:info@donkeyideas.com"
              className="btn btn-accent btn-xl"
            >
              info@donkeyideas.com
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
        </div>
      </section>

      <Footer />
    </>
  );
}
